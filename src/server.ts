import { lstat, readFile } from 'fs'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { ServerSideGame } from './server-side-game'

const game = new ServerSideGame()

const contentTypeByExtension = {
	'html': 'text/html',
	'css': 'text/css',
	'js': 'application/javascript',
}

const sendFile = (req: IncomingMessage, res: ServerResponse, fileName: string) => {
	const ifModifiedSince = new Date(req.headers['if-modified-since']).getTime() || 0
	lstat(fileName, (err, stats) => {
		if (err) {
			if (fileName.endsWith('.js'))
				return res.writeHead(404).end()
			else
				return sendFile(req, res, `${fileName}.js`)
		}
		if (stats.isSymbolicLink())
			return readFile(fileName, (err, data) => {
				if (err) return res.writeHead(500).end()
				res.writeHead(200, {
					'Content-Type': `application/javascript;charset=utf8`,
				})
				res.end(data)
			})

		if (stats.isFile())
			if (stats.mtimeMs - 1000 > ifModifiedSince) {
				return readFile(fileName, (err, data) => {
					if (err) return res.writeHead(500).end()
					res.writeHead(200, {
						'Content-Type': `${contentTypeByExtension[fileName.substr(fileName.lastIndexOf('.') + 1)] || 'application/octet-stream'};charset=utf8`,
						'Last-Modified': stats.mtime.toUTCString(),
						'Cache-Control': 'max-age=5;must-revalidate',
					})
					res.end(data)
				})
			} else {
				res.writeHead(304).end()
			}

		return res.writeHead(404).end()
	})
}


const server = createServer((req, res) => {
	const getParams: any = {}
	if (req.url.includes('?')) {
		const url = req.url.substr(0, req.url.indexOf('?'))
		req.url.substr(url.length + 1)
			.split('&')
			.map(e => e.split('=', 2))
			.forEach(e => getParams[decodeURIComponent(e[0])] = decodeURIComponent(e[1]))
		req.url = url
	}
	switch (req.method) {
		case 'GET':
			switch (req.url) {
				case '/':
					return sendFile(req, res, 'static/index.html')
				case '/js/three':
				case '/js/three.js':
					return sendFile(req, res, 'static/three.js')
				case '/game/register':
					return game.registerNewPlayer(getParams, res)
				case '/game/reset-players':
					return game.resetGame(res)
				case '/game/pool-events':
					return game.poolEvents(getParams, res)
				case '/game/make-move':
					return game.makeMove(getParams, res)
				default:
					const path = req.url
						.split('/')
						.filter(e => e)
						.map(e => decodeURIComponent(e))
						.join('/')
					if (!path.includes('..'))
						return sendFile(req, res, `static/${path}`)
			}
			break
	}
	res.writeHead(404).end()
})

const host = '0.0.0.0'
const port = 8002
server.listen(port, host
	.replace('[', '')
	.replace(']', ''), () => {
	console.info(`Server started at http://${host}:${port}`)
})


