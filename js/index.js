var EventCenter = {
    on(type, handler) {
        document.addEventListener(type, handler)
    },
    fire(type, data) {
        var event = new CustomEvent(type, { detail: data })
        document.dispatchEvent(event)
    }
}


var Footer = {
    init() {
        this.$leftBtn = $('footer .icon-shangyi');
        this.$rightBtn = $('footer .icon-xiayi');
        this.$list = $('footer ul');
        this.ending = false;
        this.beginning = true;
        this.isAnimate = false;
        this.getData(this.render);
        this.bind();
    },
    bind() {
        var _this = this
        this.$rightBtn.on('click', function () {
            if (_this.isAnimate) return
            if (_this.ending) return
            var boxWidth = $('footer .box').width();
            var itemWidth = $('footer ul li').outerWidth(true)
            var listWidth = _this.$list.width()
            var number = Math.floor(boxWidth / itemWidth);
            _this.isAnimate = true
            _this.$list.animate({
                left: '-=' + number * itemWidth + 'px'
            }, 400, function () {
                _this.isAnimate = false;
                _this.beginning = false;
                var leftCss = parseInt(_this.$list.css('left'));
                if (listWidth + leftCss < boxWidth) {
                    _this.ending = true;
                    _this.beginning = false;
                }
            });
        })

        this.$leftBtn.on('click', function () {
            if (_this.isAnimate) return
            if (_this.beginning) return
            var boxWidth = $('footer .box').width();
            var itemWidth = $('footer ul li').outerWidth(true);
            var number = Math.floor(boxWidth / itemWidth);
            _this.isAnimate = true;
            _this.$list.animate({
                left: '+=' + number * itemWidth + 'px'
            }, 400, function () {
                _this.isAnimate = false;
                _this.ending = false;
                var leftCss = parseInt(_this.$list.css('left'));
                if (leftCss >= (-itemWidth)) {
                    _this.beginning = true;
                    _this.ending = false;
                }
            });
        })

        this.$list.on('click', 'li', function () {
            var id = $(this).attr('id');
            var name = $(this).attr('name')
            EventCenter.fire('select-album', {
                'id': id,
                'name': name
            });
            console.log(this);
            $(this).addClass('active').siblings().removeClass('active')
            
        })
    },
    getData(callback) {
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
            .done(function (data) {
                callback(data.channels)
            })
            .fail(function () {
                console.log('error')
            })
    },
    render(data) {
        $.each(data, function (index, item) {
            var html = ''
            html += '<li' + ' id="' + item.channel_id + '" name="' + item.name + '">'
            html += '<div style="background-image:url(' + item.cover_small + ')"></div>'
            html += '<h3>' + item.name + '</h3>'
            html += '</li>'
            var $node = $(html)
            $('footer ul').append($node)
        })
    }
}
var Fm = {
    init() {
        this.$main = $('main');
        this.$actions = this.$main.find('.actions');
        this.$details = $('main .details');
        this.$background = $('.background');
        this.audio = new Audio();
        this.audio.autoplay = true;
        this.channelId = 'public_tuijian_rege';
        this.album = '热歌';
        Footer.init()
        this.bind()
        this.loadMusic(this.loadLyric)
    },
    bind() {
        var _this = this
        EventCenter.on('select-album', function (e) {
            _this.channelId = e.detail.id;
            _this.album = e.detail.name;
            _this.loadMusic(_this.loadLyric);
        })
        this.$actions.find('.btn-play').on('click', function(){
            if(_this.$actions.find('.btn-play').hasClass('icon-play')){
                _this.$actions.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
                _this.audio.play();
            }else{
                _this.$actions.find('.btn-play').removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause();
            }
        })
        this.$actions.find('.btn-next').on('click', function(){
            _this.loadMusic(_this.loadLyric);
        })
        this.audio.addEventListener('play', function(){
            var percent;
            var min
            var sec
            clearInterval(_this.clock);
            _this.clock = setInterval(function() {
                percent = _this.audio.currentTime/_this.audio.duration*100;
                _this.$details.find('.bar-progress').css('width', percent+'%');
                min = Math.floor(_this.audio.currentTime / 60);
                sec = Math.floor(_this.audio.currentTime % 60);
                sec = sec < 10 ? '0'+sec : ''+sec;
                var time = min+':'+sec
                _this.$details.find('.current-time').text(time);
                if(_this.lyricObj && _this.lyricObj['0'+time]){
                    _this.$details.find('.lyric p').text(_this.lyricObj['0'+time]).boomtext('fadeIn');
                }
            }, 1000)
        })
        this.audio.addEventListener('pause', function(){
            clearInterval(_this.clock);
        })
        this.$details.find('.bar').on('click', function(e){
            var width = _this.$details.find('.bar').width();
            var offset = e.offsetX;
            var percent = (offset/width)*100;
            _this.$details.find('.bar-progress').css('width', percent + '%');
            _this.audio.currentTime = _this.audio.duration*(percent/100);
        })
    },
    loadMusic(callback) {
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php', { channel: _this.channelId })
            .then(function (ret) {
                var song = ret['song'][0];
                _this.$details.find('.album').text(_this.album);
                _this.$details.find('h1').text(song.title);
                _this.$main.find('.pic').css('background-image', 'url('+song.picture+')');
                _this.$details.find('.author').text(song.artist);
                _this.$background.css('background-image', 'url('+song.picture+')');
                _this.audio.src = song.url;
                callback(_this,song.sid);
                _this.$actions.find('.btn-play').removeClass('icon-play').addClass('icon-pause');
                _this.audio.play();
            })
            .fail(function(error){
                console.log(error);
            })
    },
    loadLyric(context,sid){
        var _this = context
        $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php',{'sid': sid})
        .then(function(ret){
            var lyric = ret.lyric
            var lyricObj = {}
            lyric.split('\n').forEach(function(line){
                var times = line.match(/\d{2}:\d{2}/g) 
                var str = line.replace(/\[.+?\]/g, '')
                if(Array.isArray(times)){
                    times.forEach(function(time){
                        lyricObj[time] = str
                    })
                }
            })
            _this.lyricObj = lyricObj
        })
        .fail(function(ret){
            _this.lyricObj = {}
            _this.$details.find('.lyric p').text('纯音乐，无歌词');
        })
    }
}
$.fn.boomtext = function(type){
    type = type || 'rollIn'
    this.html(function(){
        return $(this).text().split('').map(function(word){
            return '<span>' + word + '</span>'
        }).join('');
    })
    var index = 0
    var $boomtext = $(this).find('span');
    var clock = setInterval(function(){
        $boomtext.eq(index).addClass('animated ' + type)
        index++
        if(index >= $boomtext.length){
            clearInterval(clock);
        }
    }, 200)
}
Fm.init();