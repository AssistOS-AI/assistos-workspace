async function activateUser(activationToken) {
    const userPendingActivationFilePath = path.join(__dirname, '../../../', USER_PENDING_ACTIVATION_PATH);
    const userPendingActivationObject = JSON.parse(await fsPromises.readFile(userPendingActivationFilePath));
    if (!userPendingActivationObject[activationToken]) {
        const error = new Error('Invalid activation token');
        error.statusCode = 404;
        throw error;
    }

    if (isActivationTokenExpired(userPendingActivationObject[activationToken].verificationTokenExpirationDate)) {
        delete userPendingActivationObject[activationToken]
        await fsPromises.writeFile(userPendingActivationFilePath, JSON.stringify(userPendingActivationObject, null, 2), 'utf8');
        const error = new Error('Token Activation Expired');

        error.statusCode = 404;
        throw error;
    }

    const userData = userPendingActivationObject[activationToken];
    try {
        const userDataObject = await createUser(userData.name, userData.email, true);
        const userMapPath = path.join(__dirname, '../../../', USER_MAP_PATH);
        const userMapObject = JSON.parse(await fsPromises.readFile(userMapPath));
        userMapObject[userData.email] = userDataObject.id;
        await fsPromises.writeFile(userMapPath, JSON.stringify(userMapObject, null, 2), 'utf8');
        const userCredentialsPath = path.join(__dirname, '../../../', USER_CREDENTIALS_PATH);
        const userCredentialsObject = JSON.parse(await fsPromises.readFile(userCredentialsPath));
        userCredentialsObject[userDataObject.id] = userData;
        userCredentialsObject[userDataObject.id].activationDate = getCurrentUTCDate();
        await fsPromises.writeFile(userCredentialsPath, JSON.stringify(userCredentialsObject, null, 2), 'utf8');
        return userDataObject;
    } catch (error) {
        throw error;
    } finally {
        delete userPendingActivationObject[activationToken]
        await fsPromises.writeFile(userPendingActivationFilePath, JSON.stringify(userPendingActivationObject, null, 2), 'utf8');
    }
}


async function addSpaceCollaborator(spaceId, userId, role) {
    await linkSpaceToUser(userId, spaceId)
    try {
        await linkUserToSpace(spaceId, userId, role)
    } catch (error) {
        await unlinkSpaceFromUser(userId, spaceId);
        throw error;
    }
}


async function createDemoUser() {
    console.log("Creating Demo User")
    try {
        await registerUser(username, email,hashPassword(password))
        const usersPendingActivation = require('../../data-volume/UsersPendingActivation.json')
        const activationToken = Object.keys(usersPendingActivation)[0]
        await activateUser(activationToken)
        console.log('Demo User Created')
    } catch (e) {
        console.error(`Failed Creating Demo User` + e)
    }
}



async function createUser(username, email, withDefaultSpace = false) {
    const rollback = async () => {
        try {
            await fsPromises.rm(userPath, {recursive: true, force: true});
        } catch (error) {
            throw error;
        }
        if (withDefaultSpace) {
            deleteSpace(userData.currentSpaceId)
        }
    }

    const userId = generateId();
    const spaceName = templateReplacer_$$(
        defaultSpaceNameTemplate,
        {
            username: username.endsWith('s') ? username + "'" : username + "'s"
        }
    )
    const userData = templateReplacer_$$(defaultUserTemplate,
        {
            id: userId,
            username: username,
            email: email,
        }
    )

    const userPath = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId}.json`);
    try {
        await fsPromises.writeFile(userPath, JSON.stringify(userData, null, 2), 'utf8');
        if (withDefaultSpace) {
            const createdSpaceId = (await createSpace(spaceName, userId)).id;
            userData.currentSpaceId = createdSpaceId
            userData.spaces.push(createdSpaceId);
            await fsPromises.writeFile(userPath, JSON.stringify(userData, null, 2), 'utf8');
        }
        return userData;
    } catch (error) {
        error.message = 'Error creating user';
        error.statusCode = 500;
        await rollback();
        throw error;
    }
}





async function getActivationFailHTML(failReason) {
    let redirectURL = ENVIRONMENT_MODE === 'development' ? DEVELOPMENT_BASE_URL : PRODUCTION_BASE_URL

    return templateReplacer_$$(activationSuccessTemplate, {
        redirectURL: redirectURL,
        failReason: failReason
    })
}



async function getActivationSuccessHTML() {
    let loginRedirectURL = ENVIRONMENT_MODE === 'development' ? DEVELOPMENT_BASE_URL : PRODUCTION_BASE_URL
    return templateReplacer_$$(activationSuccessTemplate, {
        loginRedirectURL: loginRedirectURL
    })
}



async function getUserData(userId) {
    const userFile = JSON.parse(await getUserFile(userId));
    const spacesMap = await getSpacesMap();
    userFile.spaces = userFile.spaces.map(space => {
        return {
            name: spacesMap[space],
            id: space
        };
    });
    return userFile;
}

async function getUserFile(userId) {
    const userFilePath = await getUserFilePath(userId)
    try {
        await fsPromises.access(userFilePath);
    } catch (e) {
        const error = new Error(`User with id ${userId} does not exist`);
        error.statusCode = 404;
        throw error;
    }
    let userFile = await fsPromises.readFile(userFilePath, 'utf8');
    return userFile;
}



function getUserFilePath(userId) {
    return path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
}



async function getUserIdByEmail(email) {
    const userMapPath = path.join(__dirname, '../../../', USER_MAP_PATH);
    const userMapObject = JSON.parse(await fsPromises.readFile(userMapPath));

    if(userMapObject[email]){
        return userMapObject[email];
    }else{
        const error = new Error('No user found with this email');
        error.statusCode = 404;
        throw error;
    }
}

async function linkSpaceToUser(userId, spaceId) {
    const userFile = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
    let userObject;
    let userFileContents;

    try {
        userFileContents = await fsPromises.readFile(userFile, 'utf8');
    } catch(error) {
        error.message =`User ${userId} not found.`;
        error.statusCode = 404;
        throw error;
    }
    try {
        userObject = JSON.parse(userFileContents);
    } catch (error) {
        error.message = `Corrupted user file for userId ${userId}.`
        error.statusCode = 500;
        throw error;
    }
    if (userObject.spaces.some(space => space.id === spaceId)) {
        const error = new Error(`Space ${spaceId} is already linked to user ${userId}.`);
        error.statusCode = 400;
        throw error;
    }

    userObject.spaces.push(spaceId);

    try {
        userObject.currentSpaceId = spaceId;
        await fsPromises.writeFile(userFile, JSON.stringify(userObject, null, 2));
    } catch (error) {
        error.message=`Failed to update user file for userId ${userId}.`;
        error.statusCode = 500;
        throw error;
    }
}


async function linkUserToSpace(spaceId, userId, role) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    if (!spaceStatusObject.users || !Array.isArray(spaceStatusObject.users)) {
        const error = new Error(`Corrupted Space file for Space: ${spaceStatusObject.name}`);
        error.statusCode = 500;
        throw error;
    }
    if (!spaceStatusObject.users.find(user => user.userId === userId)) {
        spaceStatusObject.users.push(
            {
                userId: userId,
                role: role,
                joinDate: getCurrentUTCDate()
            }
        )
    } else {
        const error = new Error(`User is already member of the Space: ${spaceStatusObject.name}`);
        error.statusCode = 409
        throw error
    }
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

async function loginUser(email, password) {
    let userId = null;
    try {
        userId = await getUserIdByEmail(email)
    } catch (error) {
        if (error.statusCode === 404) {
            error.message = 'Invalid email or password';
            error.statusCode = 404;
            throw error;
        }
        throw error;
    }
    const userCredentialsPath = path.join(__dirname, '../../../', USER_CREDENTIALS_PATH);
    const usersCredentialsObject = JSON.parse(await fsPromises.readFile(userCredentialsPath));
    if(usersCredentialsObject[userId].password === hashPassword(password)){
        return {
            success: true,
            userId:userId
        }
    }else{
        return {
            success: false,
            message: 'Invalid email or password'
        }
    }
}

async function registerUser(name, email, password) {

    const currentDate = getCurrentUTCDate();
    const registrationUserObject = templateReplacer_$$(userRegistrationTemplate, {
        email: email,
        name: name,
        passwordHash: hashPassword(password),
        verificationToken: await generateVerificationToken(),
        verificationTokenExpirationDate: incrementDate(currentDate, {minutes: 30}),
        currentDate: currentDate,
    })
    const userMapFilePath = path.join(__dirname, '../../../', USER_MAP_PATH);
    const userMapObject = JSON.parse(await fsPromises.readFile(userMapFilePath));
    if (userMapObject[email]) {
        const error = new Error(`User with email ${email} already exists`);
        error.statusCode = 409;
        throw error;
    }

    const userPendingActivationFilePath = path.join(__dirname, '../../../', USER_PENDING_ACTIVATION_PATH);
    const userPendingActivationObject = JSON.parse(await fsPromises.readFile(userPendingActivationFilePath));
    userPendingActivationObject[registrationUserObject.verificationToken] = registrationUserObject
    await fsPromises.writeFile(userPendingActivationFilePath, JSON.stringify(userPendingActivationObject, null, 2));
    await sendActivationEmail(email, name, registrationUserObject.verificationToken);
}


async function sendActivationEmail(emailAddress, username, activationToken) {
    await EmailService.getInstance().sendActivationEmail(emailAddress, username, activationToken);
}

async function unlinkSpaceFromUser(userId, spaceId) {
    const userFile = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId}.json`);
    let userObject;
    try {
        const userFileContents = await fsPromises.readFile(userFile, 'utf8');
        userObject = JSON.parse(userFileContents);
    } catch (error) {
        if (error.code === 'ENOENT') {
            error.message = `User ${userId} not found.`;
            error.statusCode = 404;
        } else {
            error.message = `Failed to read or parse user file for userId ${userId}.`;
            error.statusCode = 500;
        }
        throw error;
    }

    const spaceIndex = userObject.spaces.findIndex(space => space.id === spaceId);
    if (spaceIndex === -1) {
        return;
    }

    userObject.spaces.splice(spaceIndex, 1);

    if (userObject.currentSpaceId === spaceId) {
        delete userObject.currentSpaceId;
    }

    try {
        await fsPromises.writeFile(userFile, JSON.stringify(userObject, null, 2));
    } catch (error) {
        error.message = `Failed to update user file for userId ${userId}.`;
        error.statusCode = 500;
        throw error;
    }
}



async function updateUserFile(userId,userObject) {
    const userFile = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
    await fsPromises.writeFile(userFile,userObject,'utf8',{encoding: 'utf8'});
}




async function updateUsersCurrentSpace(userId, spaceId) {
    let userFile = JSON.parse(await getUserFile(userId));
    userFile.currentSpaceId = spaceId;
    const userFilePath = getUserFilePath(userId);
    await fsPromises.writeFile(userFilePath, JSON.stringify(userFile, null, 2));
}

