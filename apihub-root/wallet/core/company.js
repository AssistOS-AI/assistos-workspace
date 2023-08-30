import {DocumentsRegistry} from "../imports.js";
export class Company {
    constructor(userType) {
        /* Prevent creating a new Instance with the new keyword */
        if (Company.instance) {
            return Company.instance;
        }
        this.load(userType);
        this.observers=[];
    }

    async load(userType) {
        if(userType!=="lite") {
            let response = await fetch('/wallet/data.json');
            this.companyState = await response.json();
        }else{
            /* We could load only the data we need for the current page instead? */
            this.companyState=await this.loadDatabaseData();
        }
        this.documentsRegistry=DocumentsRegistry.getInstance(this.companyState.documents);
        this.notifyObservers();
    }

    async loadDatabaseData(){
            await webSkel.liteUserDB.init();
            /* Static document for testing the UI, to be removed */
            let docObj={
                id : 0,
                name: "UI Lorem Ipsum Document",
                abstract: "Lorem ipsum dolor sit amet, qui civibus intellegat percipitur ei. Sale verterem intellegat ea est, mea ei altera disputando referrentur. Pri ne dicant latine, cu nullam eloquentiam referrentur mea, per dictas omnium impetus ut. Mazim quaeque usu id. Ex quo aeterno scribentur, vis essent oblique an.\n\nCeteros molestie facilisi his in, cu saperet facilisi eum. Est legendos voluptatum ut, duo meis fastidii ea, meliore tibique nominavi sea cu. Inani ludus ullamcorper ne qui, cu purto natum audiam vis, viris ludus electram an his. Idque nonumes vel te, commodo ancillae in eos. Tollit petentium prodesset duo no, odio euripidis cu vis.",
                chapters: [
                    {
                        "name": "Chapter 1 - Issue type definition",
                        "content": "Mel te prompta nonumes, est an iuvaret aliquando consequuntur. At sed dicat soleat mucius, semper erroribus gloriatur ne vel. Ei exerci latine sea, eu reque dicant scriptorem ius. Vis esse vide ne. Ad dolor facilis deterruisset duo, has agam oblique at.\n\nVide voluptatum vel in. Quando dolorem pri et. Detracto urbanitas maiestatis qui an, te vis adhuc patrioque conclusionemque, quo ex rebum aperiam. Sed mazim latine delenit ut.\n\nNo alienum delectus mea, te autem detraxit per. Ea eirmod phaedrum lobortis sea. Has sale tibique cu, id his rebum intellegebat. Impedit accumsan molestie qui no, ex mel consequat assentior. Et atqui perpetua mei, ad usu ferri omnes detraxit.\n\nVis altera discere ullamcorper at. An usu zril disputando, unum facilisis scripserit et mea, mei assum debet eu. Eruditi civibus adipisci mel id, an hinc adhuc indoctum sit. Mel inermis sensibus et, ex mei facer moderatius. Ne quis postulant evertitur per, malis paulo iracundia quo cu.\n\nEtiam adipisci ad vel, vis ad nemore minimum, ut agam audiam his. Vis cu prompta virtute epicurei, his quod omnium corrumpit cu. Ne duis liber salutandi mea. Ius illud vivendum persecuti in, sumo idque veniam sit et.\n\nId vidit dicit consetetur vis. Vitae fuisset disputando mei ut, ad quas munere mel, persius fierent dissentiet an eum. Per ut oratio euripidis temporibus, sed cibo nulla paulo ea. Ei pro cibo homero explicari, volutpat patrioque ne vis.\n\nMagna putant vim id, te pri dico mutat verterem. Ius no modus omnes. Mel ut affert doctus, eum an tantas elaboraret. Singulis intellegam voluptatibus eu pri, eum phaedrum definiebas ad. Vis ea vidisse iudicabit evertitur, sea at facete deserunt abhorreant.\n\nElit iriure qualisque qui ei. Ius te partem nostrud, qui ei molestie erroribus. In dictas imperdiet mnesarchum nam, nam ex assum veritus antiopam. Te ius omnis epicuri menandri, nam iriure euripidis constituto ut.\n\nDecore audire cu nec, eam mediocrem argumentum eu. Quo nonumy inciderint ei. At persius eligendi cum, et sed quas delectus. Ad per rebum tempor meliore, deleniti appareat invidunt ius in. Vel ut brute viris veniam, elit noster conclusionemque te per, ex possim laboramus eos.\n\nTe est docendi insolens. Ut error nobis per, mea vide dissentiunt an. Cum delenit repudiare no, no per patrioque conceptam. Usu no dicant laboramus, sed aeterno dolorum accusata at."
                    },
                    {
                        "name": "Chapter 2 - Issue type definition",
                        "content": "Legimus docendi mea an, mei cibo laoreet iudicabit ex, cu minim contentiones nec. Id eum justo everti. An veritus maiorum eos. Tota reque eos ut, movet mollis ei eam.\n\nNo vidit libris vel, ne voluptua luptatum recteque nam. Sea et everti veritus percipit, at facete placerat has. Eu aeterno facilisi has, assum delenit vis an, vel iuvaret fuisset facilisis ne. Iisque aliquam ius an, cu quo sint putant aeterno, et adolescens philosophia complectitur est. Magna munere te sit, ut duo etiam assueverit efficiantur. No mei adhuc labitur, erat populo scripserit in eum, mel eu malis nonumy accusata.\n\nHas ei adhuc convenire facilisis. Ne usu omnes quodsi ceteros, impedit dolores assentior mel at. Ei cum intellegat maiestatis, mei ne suas persequeris concludaturque, eum mentitum eloquentiam vituperatoribus ut. Ei adhuc populo mediocritatem vel, at suas prima sit. Eos enim definitiones eu. Sit reque harum patrioque id.\n\nLorem laudem placerat in usu, vim ex facete comprehensam mediocritatem. Ea ius zril laoreet, elit propriae eu est. An justo consulatu sea, mei an erant nostro. Ut nostrud ponderum rationibus ius, at quando libris minimum sea, sed euismod ceteros delicata eu. Et sea noluisse accusamus, pro postulant prodesset repudiandae no. Dolorem cotidieque dissentiet in cum. Ex dicta dicam maluisset vim, ad vis munere facete.\n\nTe nobis accusamus vix, at sea mundi nullam meliore, ut nostrud feugiat periculis mei. Tota iudico eleifend has id, possit latine mel et. Ut justo volutpat pri. Volutpat concludaturque mel ne. Eos putant integre eu, eum quaeque elaboraret eu.\n\nTota mentitum nec ut, mutat ignota usu te, probo paulo disputationi ea his. Veri quaerendum ex per, cu amet persequeris quo. Justo possim appareat vel ne, malis prompta ex est. Quo novum inermis efficiantur no, id eius molestiae reformidans qui. Luptatum pertinacia cum ut, regione vocibus in nam.\n\nEst simul oratio cu, iuvaret recteque facilisis at mel, in sit laudem placerat. Adhuc honestatis signiferumque cum in, atqui officiis et vel. Nibh definiebas quo at. An pri tempor eruditi pertinacia, id nominavi partiendo sea, mel congue offendit id.\n\nEi novum iudicabit cotidieque vis, te usu dicta virtute. Ei mei assum minimum. Vel te rebum graecis lobortis, modo volutpat ex usu. Summo accusam ea usu, copiosae voluptaria ad sed. Pri at errem postulant, ne porro albucius reprimique eam.\n\nEx alii maluisset nam. Pro an iudico reformidans, ut quas consulatu mel, est ut hinc nonumy. Ne eripuit definitionem nec. Ex delicata incorrupte definitionem quo, prima veritus per te. At purto mentitum scriptorem nec, primis deseruisse eu usu. Mel quaestio sensibus ne.\n\nVix dolores nominati ea, qui saepe mnesarchum ea, fugit novum vim et. Qui detracto insolens reformidans eu. Id his fugit choro laboramus, id vero vide feugiat usu, vim clita audiam dolorem ad. Sit audiam volutpat an, meis dolorem his at. Expetenda mediocritatem id qui, ex choro virtute qui. Id vis stet democritum scriptorem, per eu brute consectetuer."
                    },
                    {
                        "name": "Chapter 3 - Issue type definition",
                        "content": "No invidunt salutatus disputando mel, sea in facilisis elaboraret, mea sale latine ocurreret ne. Ullum pertinacia mea et. Eu nec vocibus blandit sapientem. An sea augue dolore mandamus. Eam idque zril explicari ei.\n\nHas vero efficiantur ad. Ut alterum docendi qui, vix cu minim voluptua deserunt. Cu mel ancillae scriptorem. Ea eos natum rebum persequeris. Omnesque moderatius mel ex, mea nemore vidisse sanctus et.\n\nIgnota graeci pertinacia at sit, eam probatus antiopam et, malis sensibus mediocritatem ea pro. Legendos corrumpit ex nec. Delenit tibique percipit vel no, sit ex dicat error offendit. Est et mutat graece, usu tation phaedrum an.\n\nCu eos tempor accumsan. An scripta petentium honestatis quo, ut eum reque dicant labitur, ne usu saperet quaestio elaboraret. Suavitate democritum nam ex, tation dignissim has ut, sea cetero referrentur at. In scriptorem definitionem nam, et mel malorum vulputate. An cum bonorum mentitum voluptatum, mei id ferri expetendis constituam. Cum esse falli tincidunt te. Has assum liber maiestatis ut.\n\nVis graeci mnesarchum ei. Mel et numquam cotidieque. Ea eos laoreet aliquando, deserunt consetetur vituperatoribus usu an. Id mea legendos moderatius, mea ei movet nostrum dignissim. Legendos constituto an vix, an qui sententiae eloquentiam.\n\nEu veniam eripuit ceteros usu, te pro volutpat recteque, ei pri legere definiebas. Vis an quaeque saperet detracto, tibique maiestatis theophrastus eos ei, ea duo fugit delicatissimi. Vis offendit voluptaria et, nam ex ullum congue. Ut wisi expetenda theophrastus vel.\n\nUt mei tota posse. Duo elitr dignissim dissentias an, his ne postea luptatum. In esse nostro labores sit, ludus invidunt no qui. Mei ne alia fabellas tincidunt. Usu id fabulas petentium intellegebat, vim cu erant tibique, sea purto natum laoreet ut."
                    },
                    {
                        "name": "Chapter 4 - Issue type definition",
                        "content": "Sea sale mollis te, appetere mediocritatem ex nam. Cu quod civibus ius, vix enim dicunt sapientem ad. Cu eum aperiri facilis voluptaria, qui ut explicari adipiscing. Cu mediocrem assueverit duo, omnis alterum facilisis nec ut. Est cetero conceptam disputationi ad, vim rebum fierent platonem ei. Quo ne alia eloquentiam, at everti fuisset aliquando qui.\n\nMazim discere interesset duo no, qui in eros minim appetere. Vis eius dicat id, semper dolores no pri, usu cu labitur perfecto consetetur. Vim ut aeque alienum maiestatis, mei no odio volumus erroribus, cu eos nullam fastidii. Vis at error meliore. Platonem similique interesset et eam, pri nostrud maiorum mediocrem ut.\n\nUt mea falli iisque, ius saepe reprimique te, at audiam urbanitas duo. Cum accusata hendrerit te, mazim errem ei pro, his at consul commodo. Tation persecuti usu ea. Qui an erroribus repudiare. An duis virtute invidunt eam, sit veri epicuri mentitum ex, ei semper option euripidis sed.\n\nAlia sale eruditi in vix. Euripidis definitiones ad sed, et ferri omnesque legendos est. Magna bonorum ut eam. Vix latine impedit legendos an, has ut simul convenire patrioque. Alia disputando dissentiunt no eum, quas dolorum oportere ea mei.\n\nEa nonumes consulatu his, usu in adipisci percipitur. Cum cotidieque appellantur ex, id alii tollit suavitate qui, his in simul ludus comprehensam. Quod posse feugait vis te, tale atqui meliore id sed. Fierent similique usu id. Vim at oratio sanctus, vix erant option at, qui at conceptam persequeris. Qui quas eripuit et, eu sit mentitum apeirian."
                    }
                ]
            };

            await webSkel.liteUserDB.addRecord("documents",docObj);
            return await webSkel.liteUserDB.getAllRecords();
    }
    static getInstance(userType="lite") {
        if(!this.instance) {
            this.instance = new Company(userType);
        }
        return this.instance;
    }

    onChange(observerFunction) {
        this.observers.push(new WeakRef(observerFunction));
    }
    //weakset instead of array of weakrefs
    notifyObservers() {
        /*for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if (observer) {
                observer(this.companyState);
            }
        }*/
        /* Quick Fix - To be removed */
        this.observers[this.observers.length-1].deref()(this.companyState);
    }
}