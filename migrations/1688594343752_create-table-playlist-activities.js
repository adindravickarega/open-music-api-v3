/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // buat tabel playlist song activities
    pgm.createTable('playlist_activities', {
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
        },
        user_id: {
          type: 'VARCHAR(50)',
          notNull: true
        },
        action: {
          type: 'VARCHAR(10)',
          notNull: true
        },
        time: {
          type: 'VARCHAR(50)',
          notNull: true
        }
      });
};

exports.down = pgm => {
    pgm.dropTable('playlist_activities');
};
