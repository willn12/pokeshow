const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    socket.on('join-show', (showId) => {
      socket.join(`show:${showId}`)
    })

    socket.on('forum-post', (post) => {
      io.to(`show:${post.showId}`).emit('new-forum-post', post)
    })

    socket.on('forum-reply', (data) => {
      io.to(`show:${data.showId}`).emit('new-forum-reply', { reply: data, parentId: data.parentId })
    })

    socket.on('join-dm', (roomId) => {
      socket.join(`dm:${roomId}`)
    })

    socket.on('send-dm', (message) => {
      io.to(`dm:${message.roomId}`).emit('new-dm', message)
    })
  })

  const port = process.env.PORT || 3000
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
