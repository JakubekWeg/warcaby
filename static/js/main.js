import { BreakingBlockAnimation } from './breaking-block-animation';
import { FrontEndGameInstance } from './front-end-game-instance';
import { FAST_TEST_ENABLED, wait } from './shared';
import { setNicksAndColors, showBigToast, showSubToast } from './ui-controller';
document.getElementsByTagName('main')[0].style.display = null;
const breakingBlockAnimation = new BreakingBlockAnimation(document.getElementById('animation-canvas'), document.getElementById('obsidian'), document.getElementById('pickaxe'));
const INSTANCE = new FrontEndGameInstance();
const topContainer = document.getElementById('top-form-container');
const waitingForm = document.getElementById('waiting-form');
waitingForm.style.display = 'none';
waitingForm.style.opacity = '0';
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
const nickRegex = /[a-zA-Z0-9\-]{3,10}/;
const nickTextBox = document.getElementById('nick');
const submitBtn = document.getElementById('submit');
nickTextBox.addEventListener('keydown', event => (event.key === 'Enter') && submitBtn.click());
if (FAST_TEST_ENABLED) {
    for (let i = 0; i < 6; i++)
        nickTextBox.value += 'qwertyuioasdfghjklzxcvbnm'[Math.random() * 'qwertyuioasdfghjklzxcvbnm'.length | 0];
    setTimeout(() => submitBtn.click(), 100);
}
let blockButtons = false;
submitBtn.addEventListener('click', async () => {
    if (blockButtons)
        return;
    const nick = nickTextBox.value;
    if (!nickRegex.test(nick))
        return loginStatus.innerText = 'Type a correct nick';
    blockButtons = true;
    const registrationStatus = await INSTANCE.networking.register(nick);
    blockButtons = false;
    switch (registrationStatus) {
        case 412:
            loginStatus.innerText = 'There are two players already';
            break;
        case 409:
            loginStatus.innerText = 'This nick is occupied by someone else';
            break;
        default:
            loginStatus.innerText = 'An error occurred';
            break;
        case 200:
            blockButtons = true;
            loginStatus.innerText = 'Ok, welcome to checkers ' + nick;
            setNicksAndColors(nick, INSTANCE.networking.myType, null, null);
            waitingForm.style.display = null;
            await wait(FAST_TEST_ENABLED ? 0 : 1500);
            loginForm.style.opacity = '0';
            waitingForm.style.opacity = '1';
            breakingBlockAnimation.start();
            INSTANCE.networking.addEventListener('player-joined', (extra => {
                showBigToast(`Opponent joined!`, FAST_TEST_ENABLED ? 1000 : 5000);
                showSubToast(`They are playing ${extra.color} pawns`, FAST_TEST_ENABLED ? 1000 : 5000);
            }));
            if (!FAST_TEST_ENABLED)
                await Promise.all([
                    wait(600),
                    INSTANCE.networking.waitForOpponent(),
                ]);
            if (INSTANCE.networking.opponentInfo)
                setNicksAndColors(nick, INSTANCE.networking.myType, INSTANCE.networking.opponentInfo.nick, INSTANCE.networking.opponentInfo.color);
            loginForm.style.display = 'none';
            document.getElementById('waiting-status').innerText = 'Player has just joined!';
            breakingBlockAnimation.breakBlock();
            await wait(FAST_TEST_ENABLED ? 0 : 1500);
            waitingForm.style.opacity = '0';
            INSTANCE.startGame();
            await wait(FAST_TEST_ENABLED ? 0 : 1000);
            topContainer.style.display = waitingForm.style.display = 'none';
    }
});
document.getElementById('clear-game').addEventListener('click', async () => {
    if (blockButtons)
        return;
    blockButtons = true;
    const result = await INSTANCE.networking.resetGame();
    blockButtons = false;
    if (result)
        loginStatus.innerText = 'The game has been reset';
    else
        loginStatus.innerText = 'An error occurred';
});
document.body.addEventListener('contextmenu', event => event.preventDefault());
