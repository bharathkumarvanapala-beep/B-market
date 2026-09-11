// =====================================================
// B MARKET - ENQUIRY FORM
// =====================================================

console.log("CONTACT JS CONNECTED!");


const enquiryForm =
    document.getElementById("enquiryForm");


if (!enquiryForm) {

    console.error("ERROR: enquiryForm was not found!");

} else {

    console.log("ENQUIRY FORM FOUND!");


    enquiryForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("SUBMIT BUTTON CLICKED!");


        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const message =
            document.getElementById("message").value.trim();


        if (
            name === "" ||
            email === "" ||
            phone === "" ||
            message === ""
        ) {

            alert("Please fill in all details.");

            return;
        }


        alert("Sending enquiry...");


        const formData = new FormData();

        formData.append("name", name);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("message", message);


        try {

            console.log("Connecting to PHP...");


            const response = await fetch(
                "/bmarket/B%20Market_files/backend/enquiry.php",
                {
                    method: "POST",
                    body: formData
                }
            );


            const data =
                await response.text();


            console.log("PHP RESPONSE:", data);


            alert(data);


            if (response.ok) {

                enquiryForm.reset();

            }

        } catch (error) {

            console.error(
                "ENQUIRY ERROR:",
                error
            );


            alert(
                "Failed to connect to PHP backend."
            );

        }

    });

}