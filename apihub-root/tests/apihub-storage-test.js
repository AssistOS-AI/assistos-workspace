
export async function runTests(){


    /* GET */
    const result0 = await fetch("/spaces/1:documents:1/chapters:2",
        {
            method: "GET"
        });
    console.log(await result0.text());

    /* GET */
    const result1 = await fetch("/spaces/1:documents:1//",
        {
            method: "GET"
        });
    console.log(await result1.text());

    /* ADD */
    const result2 = await fetch("/spaces/1:documents:1/chapters:1:paragraphs:DOC1TESTPARA",
        {
            method: "PUT",
            body: `{"id":"DOC1TESTPARA", "text":"POST"}`,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });
    console.log(await result2.text());

    /* ADD */
    const result3 = await fetch("/spaces/1:documents:4//",
        {
            method: "PUT",
            body: `{"id":"testDOcument4json"}`,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });
    console.log(await result3.text());

    /* UPDATE */
   const result4 = await fetch("/spaces/1:documents:1/chapters:1:paragraphs:DOC1TESTPARA",
    {
        method: "PUT",
        body: `{"id":"DOC1TESTPARA","text":"updatedDoc1testpara"}`,
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    console.log(await result4.text());

/* update whole document */
const result5 = await fetch("/spaces/1:documents:1//",
    {
        method: "PUT",
        body: `{"id":"DOC1TESTPARA","text":"updatedFUlldocument1"}`,
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    console.log(await result5.text());

/* delete */
const result6 = await fetch("/spaces/1:documents:4//",
    {
        method: "DELETE"
    }
);
    console.log(await result6.text());

    /* delete */
const result7 = await fetch("/spaces/1:documents:1/chapters:1",
    {
        method:"DELETE"
    });
    console.log(await result7.text());
}
