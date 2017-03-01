import webpack from 'webpack';
import path from 'path';

export default {
  output: {
    library: 'Finity',
    libraryTarget: 'umd',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'src'),
        loader: 'babel-loader',
      },
    ],
  },
}
