const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const jsonImporter = require('node-sass-json-importer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  target: 'web',
  entry: {
    index: ['./src/scss/startpage/index.scss', './src/js/index.js', './node_modules/fullpage.js/dist/fullpage.css'],
    workshops: ['./src/scss/workshops/workshops.scss', './src/js/workshops.js'],
    online: ['./src/scss/online/online.scss', './src/js/online.js'],
    personal: ['./src/scss/personal/personal.scss', './src/js/personal.js'],
    business: ['./src/scss/business/business.scss', './src/js/business.js'],
    sparring: ['./src/scss/sparring/sparring.scss', './src/js/sparring.js'],
    speaker: ['./src/scss/speaker/speaker.scss', './src/js/speaker.js'],
    about: ['./src/scss/about/about.scss', './src/js/about.js'],
  },
  mode: 'development',
  output: {
    // path for all outputs.
    path: path.resolve(__dirname, 'dist'),
    // filename for js files
    filename: 'js/[name].bundle.js'
  },
  plugins: [
    // clean dist folder before building
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    // extracting css files to files from css-loader
    new MiniCssExtractPlugin({
      // this defines the folder where the file should be saved.
      // that means: output.path + filename. in this case 'dist/css/[name].css'
      // [name] ist the name of the entry.
      filename: 'css/[name].css',
    }),
    new CopyPlugin([
      { from: 'src/pdf/*.pdf', to: 'pdf/', flatten: true,},
    ]),
    new HtmlWebpackPlugin({
      chunks: ['index'],
      template: './src/html/index.html',
      filename: './index.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['workshops'],
      template: './src/html/workshops.html',
      filename: './html/workshops.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['online'],
      template: './src/html/online.html',
      filename: './html/online.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['personal'],
      template: './src/html/personal.html',
      filename: './html/personal.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['business'],
      template: './src/html/business.html',
      filename: './html/business.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['sparring'],
      template: './src/html/sparring.html',
      filename: './html/sparring.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['speaker'],
      template: './src/html/speaker.html',
      filename: './html/speaker.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['about'],
      template: './src/html/about.html',
      filename: './html/about.html',
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
          postcss: [
            // autoprefixer for automatic adding of browser prefixes, find the browserslist in package.json
            autoprefixer()
          ]
      }
    }),
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: path.resolve('./dist'),
  },
  module: {
    rules: [ 
      { // copying index.html to dist and urlrewriting (img tag only)
        test: /\.html$/,
        use: [
            {
              loader: "html-loader",
              options: {
                  attributes: {
                    list: [
                      {
                        tag: 'img',
                        attribute: 'src',
                        type: 'src'
                      },
                      {
                        tag: 'img',
                        attribute: 'srcset',
                        type: 'srcset',
                      },
                      {
                        tag: 'source',
                        attribute: 'src',
                        type: 'src',
                      },
                      {
                        tag: 'source',
                        attribute: 'srcset',
                        type: 'srcset',
                      },
                    ],
                  },
              }
            },
        ]
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: 'dist/',
            }
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              //url: false,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              implementation: require("sass"),
              sassOptions: {
                importer: jsonImporter({
                  convertCase: true
                }),
              }
            }
          }
        ],
      },
      { // image loader for index.html
        test: /\.(png|jpe?g|gif)$/i,
        use: (info) => ([
          {
            loader: 'file-loader',
            options: {
              // specifies output path relative to output.path
              outputPath: 'img',
              // specifies path to prefix url rewriting by css-loader. if the url was url(image.jpg) it is now url(publicPath/image.jpg).
              publicPath: path.basename(info.issuer) === 'index.html' ? './img/' : '../img/',
            }
          },
          {
            loader: 'image-webpack-loader',
            options: {
              disable: true,
              mozjpeg: {
                progressive: true,
                quality: 65
              },
              // optipng.enabled: false will disable optipng
              optipng: {
                enabled: true,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4,
                enabled: true
              },
              gifsicle: {
                interlaced: false,
              },
            }
          },
        ]),
      },
      { // video loader for index.html
        test: /\.(webm|mp4)$/i,
        use: (info) => ([
          {
            loader: 'file-loader',
            options: {
              // specifies output path relative to output.path
              outputPath: 'vid',
              // specifies path to prefix url rewriting by css-loader. if the url was url(image.jpg) it is now url(publicPath/image.jpg).
              publicPath: path.basename(info.issuer) === 'index.html' ? './vid/' : '../vid/',
            }
          },
        ]),
      },
      {
        test: /\.svg$/i,
        exclude: /font\/\S*\.svg((\?)?#\S*)?$/i,
        use: (info) => ([
          {
            loader: 'file-loader',
            options: {
              // specifies output path relative to output.path
              outputPath: 'svg',
              // specifies path to prefix url rewriting by css-loader. if the url was url(image.svg) it is now url(publicPath/image.svg).
              publicPath: path.basename(info.issuer) === 'index.html' ? './svg/' : '../svg/',
            }
          },
        ]),
      },
      {
        test: /font\/\S*\.(woff(2)?|ttf|eot|svg)((\?)?#\S*)?$/i,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'font',
            publicPath: '../font/',
          }
        }
      },
      {
          test: /\.js$/,
          exclude: /node_modules/,
          use: "babel-loader"
      }
    ]
  },
  // to fix the relative path issues for mixins! now just reference any file in scss modules with ~img or ~svg etc.
  resolve: {
    alias: {
      img: path.resolve(__dirname, 'src', 'img'),
      svg: path.resolve(__dirname, 'src', 'svg'),
      font: path.resolve(__dirname, 'src', 'font')
  }
  }
};