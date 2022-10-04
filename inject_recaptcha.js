if(window.location.search.includes("6LdIFr0ZAAAAAO3vz0O0OQrtAefzdJcWQM2TMYQH")) {
    console.log("[SAGE] [RECAPTCHA] init");
    let intervalId;
    intervalId = setInterval(() => {
        if(document.querySelector(".recaptcha-checkbox-expired")) {
            console.log("[SAGE] [RECAPTCHA] detected stuck recaptcha; reloading");
            window.location.reload();
            clearInterval(intervalId);
        }
    }, 500);
}