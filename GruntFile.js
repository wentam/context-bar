module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      build: {
        src: 'library/*.js',
        dest: 'build/contextBar.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
