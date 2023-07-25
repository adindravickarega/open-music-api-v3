/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // buat tabel authentications
    pgm.createTable('authentications', {
        token: {
          type: 'TEXT',
          notNull: true,
        },
      });
};

exports.down = pgm => {
    pgm.dropTable('authentications');
};
