window.requestAnimationFrame = window.requestAnimationFrame || function (callback) {
  return setTimeout(callback, 17)
}

;(function () {
  var _ = {
    node: {
      audio: document.getElementById('audio'),
      avatar: document.getElementById('avatar'),
      lyric: document.getElementById('lyric'),
      lyricLine: [],
      prevBtn: document.getElementById('prev_btn'),    
      playBtn: document.getElementById('play_btn'),
      pauseBtn: document.getElementById('pause_btn'),
      nextBtn: document.getElementById('next_btn'),
      title: document.getElementById('title'),
      progressBar: document.getElementById('progress_bar'),
      progressSlider: document.getElementById('progress_slider'),
      currentTime: document.getElementById('current_time'),
      durationTime: document.getElementById('duration_time'),
      playlistWrapper: document.getElementById('playlist_wrapper'),
      playlistMask: document.getElementById('playlist_mask'),
      playlist: document.getElementById('playlist'),
      playlistClose: document.getElementById('playlist_close'),
      playlistBtn: document.getElementById('playlist_btn'),
      playlistItem: [],
    },
    action: {
      play: function () {
        _.lib.removeClass(_.node.playBtn, 'active')
        _.lib.addClass(_.node.pauseBtn, 'active')
        _.node.audio.play()
        _.lib.removeClass(_.node.playlistItem.filter(function (e) { return e.getAttribute('data-src') !== _.node.audio.getAttribute('src') })[0], 'active')
        _.lib.addClass(_.node.playlistItem.filter(function (e) { return e.getAttribute('data-src') === _.node.audio.getAttribute('src') })[0], 'active')
      },
      pause: function () {
        _.lib.addClass(_.node.playBtn, 'active')
        _.lib.removeClass(_.node.pauseBtn, 'active')
        _.node.playlistItem.filter(function (e) { return _.lib.hasClass(e, 'active') }).forEach(function (e) {
          _.lib.removeClass(e, 'active')
        })
        _.node.audio.pause()
      },
      prev: function () {
        var index = _.node.playlistItem.filter(function (e) { return e.getAttribute('data-src') === _.node.audio.getAttribute('src') })[0]
          .getAttribute('data-index')
        var currentIndex = parseInt(index)
        var prevIndex = (currentIndex - 1 + _.node.playlistItem.length) % _.node.playlistItem.length
        _.action.jump(prevIndex)
      },
      next: function () {
        var index = _.node.playlistItem.filter(function (e) { return e.getAttribute('data-src') === _.node.audio.getAttribute('src') })[0]
          .getAttribute('data-index')
        var currentIndex = parseInt(index)
        var nextIndex = (currentIndex + 1) % _.node.playlistItem.length
        _.action.jump(nextIndex)
      },
      jump: function (index) {
        var paused = _.node.audio.paused
        var item = _.node.playlistItem[index]
        _.node.title.innerHTML = item.getAttribute('data-title')
        _.node.playlistItem.forEach(function (e) {
          _.lib.removeClass(e, 'current')
        })
        _.lib.addClass(item, 'current')
        _.action.loadLyric(item.getAttribute('data-lyric'))
        _.node.audio.src = item.getAttribute('data-src')
        document.title = item.getAttribute('data-title') + ' - 极简音乐播放器'
        if (paused) _.action.pause()
        else _.action.play()
      },
      scrollLyric: function (timeStamp) {
        var time = timeStamp || 0
        var currentLine = _.node.lyricLine.filter(function (e, i, a) {
          return parseFloat(e.getAttribute('data-time')) < time
            && (!a[i + 1] || parseFloat(a[i + 1].getAttribute('data-time')) > time)
        })
        if (currentLine.length === 0) { return }
        _.lib.addClass(currentLine[0], 'active')
        _.node.lyricLine.filter(function (e) {
          return _.lib.hasClass(e, 'active') && e !== currentLine[0]
        }).forEach(function (e) {
          _.lib.removeClass(e, 'active')
        })
        _.node.lyric.style.transform = 'translateY(-' + (currentLine[0].getAttribute('data-index') * 30 + 15) + 'px)'
      },
      loadLyric: function (url) {
        _.node.lyric.innerHTML = '<li class="lyric-line">正在加载歌词...</li>'
        _.lib.getData(url, function (data) {
          _.node.lyric.innerHTML = ''
          _.node.lyricLine = []
          var lyricArr = _.lib.parseLyric(data)
          lyricArr.forEach(function (e, i) {
            var lyricLine = document.createElement('li')
            lyricLine.className = 'lyric-line'
            lyricLine.innerHTML = e.text
            lyricLine.setAttribute('data-time', e.time)
            lyricLine.setAttribute('data-index', i)
            _.node.lyric.appendChild(lyricLine)
            _.node.lyricLine.push(lyricLine)
          })
        })
      },
      updateProgress: function (p) {
        var percent = (p || 0) * 100 + '%'
        _.node.progressBar.style.width = percent
        _.node.progressSlider.style.left = percent
      },
      openPlaylist: function () {
        _.lib.addClass(_.node.playlistWrapper, 'active')
      },
      closePlaylist: function () {
        _.lib.removeClass(_.node.playlistWrapper, 'active')
      },
      init: function () {
        _.lib.getData('media/playlist.json', function (data) {
          _.node.playlist.innerHTML = ''
          _.node.playlistItem = []

          // 加载播放列表
          JSON.parse(data).forEach(function (e, i) {
            var item = document.createElement('li')
            item.className = 'playlist-item'
            item.setAttribute('data-index', i)
            item.setAttribute('data-title', e.title)
            item.setAttribute('data-src', e.src)
            item.setAttribute('data-lyric', e.lyric)
            item.innerHTML = '<i class="iconfont icon-play"></i>'
              + '<span class="playlist-item-title">' + e.title + '</span>'
              + '<span class="playlist-item-time">' + e.time + '</span>'
            item.addEventListener('click', function () {
              _.action.jump(this.getAttribute('data-index'))
            })
            _.node.playlistItem.push(item)
            _.node.playlist.appendChild(item)
          })
          _.action.jump(0)

          // 播放器触发事件
          _.node.audio.addEventListener('timeupdate', function (e) {
            _.action.scrollLyric(e.target.currentTime * 1000)
            _.action.updateProgress(e.target.currentTime / e.target.duration)
            _.node.currentTime.innerHTML = _.lib.timeToString(e.target.currentTime)
          })
          _.node.audio.addEventListener('durationchange', function () {
            _.node.durationTime.innerHTML = _.lib.timeToString(_.node.audio.duration)
          })
          _.node.audio.addEventListener('ended', function () {
            _.action.next()
            _.action.play()
          })

          // 按钮事件
          _.node.prevBtn.addEventListener('click', _.action.prev)
          _.node.nextBtn.addEventListener('click', _.action.next)
          _.node.playBtn.addEventListener('click', _.action.play)
          _.node.pauseBtn.addEventListener('click', _.action.pause)
          _.node.playlistBtn.addEventListener('click', _.action.openPlaylist)
          _.node.playlistMask.addEventListener('click', _.action.closePlaylist)
          _.node.playlistClose.addEventListener('click', _.action.closePlaylist)

          // 进度条事件
          _.node.progressSlider.addEventListener('mousedown', eventStart)
          _.node.progressSlider.addEventListener('touchstart', eventStart)

          function eventStart (e) {
            var paused = _.node.audio.paused
            _.node.audio.pause()
            _.lib.addClass(_.node.progressSlider, 'active')

            var startX = 0

            if (e.type === 'mousedown') startX = e.pageX
            if (e.type ===  'touchstart') startX = e.targetTouches[0].pageX

            document.addEventListener('mousemove', eventMove)
            document.addEventListener('touchmove', eventMove)
            document.addEventListener('mouseup', eventEnd)
            document.addEventListener('touchend', eventEnd)
            
            function eventMove (e) {
              var moveX = 0
              if (e.type === 'mousemove') {
                moveX = e.pageX - startX
              }
              if (e.type === 'touchmove') {
                moveX = e.targetTouches[0].pageX - startX
              }
              _.node.progressSlider.style.transform = 'translateX(' + moveX + 'px)'
            }
            function eventEnd (e) {
              var endX = 0
              if (e.type === 'mouseup') {
                endX = e.pageX
              }
              if (e.type === 'touchend') {
                endX = e.changedTouches[0].pageX
              }
              var p = endX / window.innerWidth
              if (p < 0) p = 0
              if (p > 1) p = 1
              var jumpTime = p * _.node.audio.duration
              _.action.updateProgress(p)
              _.node.progressSlider.style.transform = 'none'
              _.node.audio.currentTime = jumpTime
              document.removeEventListener('mousemove', eventMove)
              document.removeEventListener('touchmove', eventMove)
              document.removeEventListener('mouseup', eventEnd)
              document.removeEventListener('touchend', eventEnd)
              if (paused) _.node.audio.pause()
              else _.node.audio.play()
            _.lib.removeClass(_.node.progressSlider, 'active')
            }
          }

          // 头像滚动
          var deg = 0
          function rollAvatar () {
            requestAnimationFrame(rollAvatar)
            if (!_.node.audio.paused) {
              _.node.avatar.style.transform = 'rotate(' + deg + 'deg)'
              deg = (deg + 0.5) % 360
            }
          }
          rollAvatar()
        })
      }
    },
    lib: {
      hasClass: function (node, className) {
        var exp = new RegExp(' ' + className + ' ', 'gi')
        return exp.test(' ' + node.className + ' ')
      },
      addClass: function (node, className) {
        if (!_.lib.hasClass(node, className)) {
          node.className = (node.className + ' ' + className).trim()
        }
      },
      removeClass: function (node, className) {
        node.className = (' ' + node.className + ' ').replace(' ' + className + ' ', ' ').replace(/\s+/gi, ' ').trim()
      },
      getData: function (url, callback) {
        var request = new XMLHttpRequest()
        request.open('GET', url, true)
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            callback(request.responseText)
          } else {
            alert('数据错误(' + request.status + ')')
          }
        }
        request.onerror = function () {
          alert('连接失败')
        }
        request.send()
      },
      parseLyric: function (lyricStr) {
        var temp = lyricStr.match(/\[\d{2}:\d{2}\.\d{2}\].*/gi)
        var arr = []
  
        temp.forEach(function (e) {
          var matchStr = e.replace(/\[\d{2}:\d{2}\.\d{2}\]/gi, '').replace(/(^\s+|\s+$)/gi, '')
          var matchTime = e.match(/\[\d{2}:\d{2}\.\d{2}\]/gi)
          var matchTimeStamp = matchTime.map(function (e) {
            var m = parseInt(e.match(/\[\d{2}:/gi)[0].replace(/(\[|:)/gi, ''))
            var s = parseInt(e.match(/:\d{2}\./gi)[0].replace(/(:|\.)/gi, ''))
            var ms = parseInt(e.match(/\.\d{2}\]/gi)[0].replace(/(\.|\])/gi, ''))
            return m * 60000 + s * 1000 + ms
          })
          matchTimeStamp.forEach(function (e) {
            arr.push({ time: e, text: matchStr })
          })
        })
        arr.sort(function (a, b) {
          return a.time - b.time
        })
        return arr
      },
      timeToString: function (sec) {
        var intSec = parseInt(sec)
        var s = ('0' + intSec % 60).substr(-2, 2)
        var m = parseInt(intSec / 60).toString()
        if (m.length < 2) m = '0' + m
        return m + ':' + s
      }
    }
  }
  
  _.action.init()
})()