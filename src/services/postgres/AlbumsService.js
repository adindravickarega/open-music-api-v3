const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const ClientError = require('../../exceptions/ClientError');
const {mapDBToModel} = require('../../utils');
const Redis = require('ioredis');
//const {mapDBToModelSong} = require('../../utils/song');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }
  async addAlbum({ name,year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const queryAlbum = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id]
    };
    const querySong = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM songs INNER JOIN albums ON albums.id=songs."albumId" WHERE albums.id=$1',
      values: [id]
    };
    const resultAlbum = await this._pool.query(queryAlbum);
    const resultSong = await this._pool.query(querySong);
    if (!resultAlbum.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return {
      id: resultAlbum.rows[0].id,
      name: resultAlbum.rows[0].name,
      year: resultAlbum.rows[0].year,
      coverUrl: resultAlbum.rows[0].coverUrl,
      songs: resultSong.rows,
    };
  }

  async getAlbumsById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Albums tidak ditemukan');
    }

    return result.rows.map(mapDBToModel)[0];
  }
  

  async editAlbumById(id, { name,year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id]
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async postAlbumCoverById(id, coverUrl) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2',
      values: [coverUrl, id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  //Service Album Like

  async addAlbumLikes(albumId, userId) {
    const id = `like-${nanoid(16)}`;
    await this.getAlbumById(albumId);
    
    const hasLiked = await this.verifyAlbumLikes(albumId, userId);
    console.log(hasLiked);
    if (hasLiked) {
      throw new ClientError('Album sudah dilike oleh user.');
    }
    else {
      const query = {
        text: 'INSERT INTO album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId],
      };
      const result = await this._pool.query(query);
      if (!result.rows[0].id) {
        throw new InvariantError('Like album gagal!');
      }    
      await this._cacheService.delete(`likes:${albumId}`)
      return result.rows[0].id;
      //return 'Like album berhasil!';
    }
  }

  async verifyAlbumLikes(albumId, userId) {
    const query = {
      text: 'SELECT id FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const result = await this._pool.query(query);
    if (result.rowCount) return true;
    else return false;
  }

  async deleteAlbumLikesById(albumId) {
    const query = {
      text: 'DELETE FROM album_likes WHERE album_id = $1 RETURNING id',
      values: [albumId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Like Album gagal dihapus. Id tidak ditemukan');
    }

    await this._cacheService.delete(`likes:${albumId}`);
    //await this._cacheService.set(`likes:${albumId}`, JSON.stringify('1'));
    //  return { 
    //    likes: '1',
    //   isCache: 'false',
    //  };
  }

  async getAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      if (result !== null) {
        return {
          likes: parseInt(result),
          isCache: true,
        };
      } 
    } catch (error) {
        const query = {
          text: `SELECT user_id FROM album_likes WHERE album_id = $1`,
          values: [albumId],
        };
        const result = await this._pool.query(query);

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(result.rows.length));

      const albumLikes = {
        likes: result.rows.length,
        isCache: false,
      };

      return albumLikes;
      
      
      /*const query = {
        text: `SELECT COUNT(album_id) FROM album_likes WHERE album_id = $1`,
        values: [albumId],
      };
      const result = await this._pool.query(query);
      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(result.rowCount));
      return {
        likes: result.rowCount,
        source: 'database',
      };*/
    }
  }

  
}

module.exports = AlbumsService;
