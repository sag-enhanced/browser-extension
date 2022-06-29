if(window.location.hash.startsWith("#sag/")) {
    console.log("[SAGE] init");
    const css = document.createElement("style");
    css.innerText = `#global_header{display:none;}.responsive_header{display:none !important;}#footer{display:none;}.section_title{display:none;}.row_flex{display:none !important;}.form_row:last-child{display:none;}`;
    document.head.appendChild(css);
    setInterval(() => {
        const token = document.getElementById("g-recaptcha-response").value;
        if(token) {
            const gid = document.getElementById("captchagid").value;
            console.log("[SAGE] captcha solved", token);
            const session = window.location.hash.split("/")[1];
            document.location = `https://sage.leodev.xyz/gen#token=${token}&gid=${gid}&session=${session}`;
        }
    }, 500);
}