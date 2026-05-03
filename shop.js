const totalScoreDisplay = document.getElementById("totalScoreDisplay");
const shopMessage = document.getElementById("shopMessage");

function loadShopStats() {
    fetch("/user-stats")
    .then(res => res.json())
    .then(data => {
        totalScoreDisplay.innerText = data.totalScore;
    });
}

function buySkin(skinName) {
    fetch("/buy-skin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ skin: skinName })
    })
    .then(res => res.json())
    .then(data => {
        shopMessage.innerText = data.message;

        if (data.totalScore !== undefined) {
            totalScoreDisplay.innerText = data.totalScore;
        }
    });
}

function equipSkin(skinName) {
    fetch("/equip-skin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ skin: skinName })
    })
    .then(res => res.json())
    .then(data => {
        shopMessage.innerText = data.message;
    });
}

function goToGame() {
    window.location.href = "/game";
}

function logout() {
    window.location.href = "/logout";
}

loadShopStats();
