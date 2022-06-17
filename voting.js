//variables,events
const options = document.querySelectorAll(".optionDiv");

for (i = 0; i < options.length; i++) {
    options[i].addEventListener("click", function () {

        console.log(this.children[0].innerText);

        if (getCookie("vote") == null) {
            vote(this);
            setCookie("vote", "already")
        }

    });
}

//calls
setInterval(showVotes, 5000);

//functions
function showVotes() {
    var address = window.location.href;
    window.location.href = address;
}

function vote(p_obj) {
    p_obj.children[2].innerText = Number(p_obj.children[2].innerText) + 1

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get("id");

    const data = {
        id_pk: id,
        title: p_obj.children[0].innerText
    }
    const options = {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(data)
    }
    fetch("/addVoteInc", options);
}

function setCookie(p_name, p_value) {
    var path = window.location.pathname;
    document.cookie = `${p_name}=${p_value}; path=${path}`;
}

function getCookie(c_name) {
    var c_value = "" + document.cookie;
    var c_start = c_value.indexOf("" + c_name + "=");
    if (c_start == -1) {
        c_value = null;
    }
    else {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if (c_end == -1) {
            c_end = c_value.length;
        }
        c_value = c_value.substring(c_start, c_end);
    }
    console.log(c_value)
    return c_value;
}

function copyToClipBoard() {
    navigator.clipboard.writeText(window.location.href);
}