const ClientError = require('../../exceptions/ClientError');

class AlbumsHandler {
  constructor(service, validator, storageService, uploadValidator) {
    this._service = service;
    this._validator = validator;
    this._storageService = storageService;
    this._uploadValidator = uploadValidator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumsHandler = this.getAlbumsHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);    
    this.postUploadCoverHandler = this.postUploadCoverHandler.bind(this);
    this.postAlbumLikeHandler = this.postAlbumLikeHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
    this.deleteAlbumLikeHandler = this.deleteAlbumLikeHandler.bind(this);
  }

  async postAlbumHandler(request,h) {
    try {
      this._validator.validateAlbumPayload(request.payload);
      const { name,year } = request.payload;
      const albumId = await this._service.addAlbum({ name, year });
      const response = h.response({
        status: 'success',
        message: 'Album berhasil ditambahkan',
        data: {
          albumId,
        },
      }, );
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      // Server Error
      const response = h.response({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getAlbumsHandler(request, h) {
    try {
      const { albums, isCache } = await this._service.getAlbums();
      const response = h.response({
        status: 'success',
        message: 'Berhasil mengambil daftar album',
        data: {
          albums,
        },
      });
      if (isCache) response.header('X-Data-Source', 'cache');
      response.code(200);
      return response;
    } catch (error) {
      // Server Error
      const response = h.response({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getAlbumByIdHandler(request,h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    const response = h.response({
      status: 'success',
      data: {
        album: album
      }
    });

    if (album.source === 'cache') {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }


  async putAlbumByIdHandler(request,h) {
    this._validator.validateAlbumPayload(request.payload);

    const { id } = request.params;
    await this._service.editAlbumById(id, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil diubah'
    });

    response.code(200);
    return response;
  }

  async deleteAlbumByIdHandler(request, h) {
    try {
      const { id } = request.params;
      await this._service.deleteAlbumById(id);
      const response = h.response({
        status: 'success',
        message: 'Berhasil menghapus album',
      });
      response.code(200);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server Error
      const response = h.response({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  // cover album
  async postUploadCoverHandler(request,h) {
    try{
      const { cover } = request.payload;
      const { id } = request.params;
      this._validator.validateAlbumCover(cover.hapi.headers);
      const filename = await this._storageService.writeFile(cover, cover.hapi);
      
      const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/albums/file/covers/${filename}`;
      
      await this._service.postAlbumCoverById(id, fileLocation);
      
      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
        data: {
          fileLocation,
        }
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server Error
      const response = h.response({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
      response.code(500);
      console.error(error);
      return response;
    }
    
  }

  // like
  async postAlbumLikeHandler(request, h) {
    try {
      const { id: credentialId } = request.auth.credentials;
      const { id } = request.params;
      const message = await this._service.addAlbumLikes(id, credentialId);
      const response = h.response({
        status: 'success',
        message,
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kesalahan pada server kami!',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
  
  async getAlbumLikesHandler(request, h) {
    try {
      const { id} = request.params;
      const { likes, isCache } = await this._service.getAlbumLikes(id);
      const response = h.response({
        status: 'success',
        data: {
          likes,
        },
      });
      response.code(200);
  
      if (isCache) {
        response.header('X-Data-Source', 'cache');
      }
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      // Server Error
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan di server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
  
  async deleteAlbumLikeHandler(request, h) {
    try {
      const { id } = request.params;
      await this._service.deleteAlbumLikesById(id);
      const response = h.response({
        status: 'success',
        message: 'Berhasil menghapus like album',
      });
      response.code(200);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
    }
  }
}

module.exports = AlbumsHandler;
