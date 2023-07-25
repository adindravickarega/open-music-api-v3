/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // buat tabel playlist songs
    pgm.createTable('playlist_songs', {
        id: {
          type: 'VARCHAR(50)',
          primaryKey: true
        },
        playlist_id: {
          type: 'VARCHAR(50)',
          notNull: true
        },
        song_id: {
          type: 'VARCHAR(50)',
          notNull: true
        }
      });
};

exports.down = pgm => {
    pgm.dropTable('playlist_songs');
};
