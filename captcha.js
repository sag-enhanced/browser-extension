if(window.location.hash.startsWith("#sage/")) {
    console.log("[SAGE] init");
    const css = document.createElement("style");
    css.innerText = `.section_title,.row_flex,.form_row:last-child,.responsive_header,#global_header,#footer,#footer_spacer{display:none !important;}#captcha_entry{position: fixed;top: 0;left: 0;height: 100vh;width: 100vw;display: flex;justify-content: center;align-items: center;}`;
    document.head.appendChild(css);
    setInterval(() => {
        const token = document.getElementById("g-recaptcha-response");
        if(token && token.value) {
            const gid = document.getElementById("captchagid").value;
            console.log("[SAGE] captcha solved", token.value);
            const session = window.location.hash.split("/")[1];
            document.location = `https://sage.leodev.xyz/gen#token=${token.value}&gid=${gid}&session=${session}`;
        }
    }, 500);
}