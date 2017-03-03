Player 56s
==========

Player 56s is simple in use web audio-player with a playlist, responsive design
and ability to enable minimalistic view mode.

Player 56s was made for an international art community and a record label
[56stuff.com](http://www.56stuff.com/) and published as open-souce with
the permission of the company.

Player 56s based on [Jouele](https://github.com/ilyabirman/Jouele) web player
by Ilya Birman and Evgeniy Lazarev. I have been inspired by simplicity and style
of their project. Thank you guys.


Dependencies and testing
------------------------

Application requires [jQuery](https://jquery.com/)
and [jPlayer](http://jplayer.org/).

Has been tested with jQuery v2.1.4 and v2.2.4 and jPlayer v2.9.2.


Installation
------------

### HTML

    <!-- Add dependencies: jQuery and jPlayer -->
    <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jplayer/2.9.2/jplayer/jquery.jplayer.min.js"></script>

    <!-- Add player 56s code and style files -->
    <link href="player56s.css" rel="stylesheet"/>
    <script src="player56s.min.js"></script>

Do not forget to put player56s_sprite.png file to the same directory
where 'player56s.css' placed.


Usage
-----

### Single track

Just add anchor tag with class 'player56s' to page html, put audio file url
to the 'href' attribute and add track title in tag content. It will become
a default player without playlist.

    <a href="audios/birman_news.mp3" class="player56s">Ilya Birman - News</a>

<img src="http://static.dymio.net/player-56s/screens/player_56s_s_single.png">

You can place author name to the track title with dividing it from track name
by minus (`-`) or medium dash (`&mdash;`).


### Several tracks

You can add several tracks to one player. Add to two or more anchors atrribute
'rel' with the same value. It will become one player with ability to switch
tracks.

    <a href="audios/yh_vests.mp3" class="player56s" rel="group1">Yellowhead - Vests Must Be Used</a>
    <a href="audios/yh_cabin.mp3" class="player56s" rel="group1">Yellowhead - Cabin Pressure</a>

<img src="http://static.dymio.net/player-56s/screens/player_56s_s_playlist.png">


### Minimalistic view

Swich player to the minimalistic view with adding 'minimal' css class to the
anchor and attribute 'data-length' with length of track in format 'M:SS'.

    <a href="audios/ios_atelier.mp3" class="player56s minimal" data-length="4:33">
      Idiosync - Atelier
    </a>

<img src="http://static.dymio.net/player-56s/screens/player_56s_s_minimalistic.png">

It works only for single track.


Contributing
------------

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Feel free to use code of the project as you want,
[create issues](https://github.com/dymio/player-56s/issues)
or make pull requests.


License
-------

[MIT License](LICENSE).
