if(window.location.hash === "#sage") {
    console.log("[SAGE] [STEAM] init");
    setTimeout(() => {
        // the setTimeout makes sure the DOM is setup and we can actually add the css
        const css = document.createElement("style");
        css.innerText = `.section_title,.row_flex,.form_row:last-child,.responsive_header,#global_header,#footer,#footer_spacer{display:none !important;}.responsive_page_content,.responsive_page_template_content,.joinsteam_content_container{padding:0px !important;}#captcha_entry{position: fixed;top: 0;left: 0;height: 100vh;width: 100vw;display: flex;justify-content: center;align-items: center;}`;
        document.head.appendChild(css);
    }, 0);
    let intervalId;
    intervalId = setInterval(() => {
        const token = document.getElementById("g-recaptcha-response");
        if(token && token.value) {
            const gid = document.getElementById("captchagid").value;
            console.log("[SAGE] [STEAM] captcha solved", token.value);
            let origin = "https://sage.leodev.xyz";
            if(document.referrer) {
                const referrer = new URL(document.referrer);
                if(referrer.origin && referrer.origin.includes("localhost"))
                    origin = referrer.origin;
            }
            document.location = `${origin}/gen#token=${token.value}&gid=${gid}`;
            clearInterval(intervalId);
        };
    }, 500);
}