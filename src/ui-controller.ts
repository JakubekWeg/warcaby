import { PlayerType } from './shared'

export const setNicksAndColors = (nick1: string, color1: PlayerType,
                                  nick2: string, color2: PlayerType) => {

	document.getElementsByTagName('header')[0].style.display = null

	document.getElementById('nick1').innerText = nick1 || '?'
	document.getElementById('color1').innerText = color1 || '?'
	document.getElementById('nick2').innerText = nick2 || '?'
	document.getElementById('color2').innerText = color2 || '?'
}

const timer = document.getElementById('timer')
let timerExpires = 0
export const runTimer = (expires: number) => {
	timer.style.display = null
	timerExpires = expires
}

export const hideTimer = () => (timer.style.display = 'none') && (timerExpires = 0)

setInterval(() => timerExpires && (timer.innerText = `${Math.max((timerExpires - Date.now()) / 1000 | 0, 0)}s`), 1_000)

const mainText = {
	timeoutId: null,
	allowShowAt: 0,
	hiding: false,
	container: document.getElementById('main-message-container'),
	text: document.getElementById('main-message'),
	shadow: document.getElementById('main-message-shadow'),
}
const subText = {
	timeoutId: null,
	allowShowAt: 0,
	hiding: false,
	container: document.getElementById('sub-message-container'),
	text: document.getElementById('sub-message'),
	shadow: document.getElementById('sub-message-shadow'),
}

const showText = (obj: any, message: string, timeout: number) => {
	const now = Date.now()
	if (obj.allowShowAt <= now) {
		obj.hiding = false
		obj.container.style.opacity = '1'
		obj.shadow.innerHTML = obj.text.innerHTML = message
		obj.timeoutId = setTimeout(() => {
			obj.container.style.opacity = '0'
		}, timeout + 500)
		obj.allowShowAt = now + timeout + 1000
	} else if (obj.hiding) {
		setTimeout(() => showText(obj, message, timeout), now - obj.allowShowAt + 100)
	} else {
		obj.hiding = true
		obj.allowShowAt = now + 500
		obj.container.style.opacity = '0'
		clearTimeout(obj.timeoutId)
		setTimeout(() => showText(obj, message, timeout), 500)
	}
}

export const showBigToast = (message: string, timeout: number = 3000) => showText(mainText, message, timeout)

export const showSubToast = (message: string, timeout: number = 3000) => showText(subText, message, timeout)
