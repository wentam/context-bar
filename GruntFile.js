module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      build: {
        src: ['library/contextBarItem.js','library/contextBar.js'],
        dest: 'build/contextBar.js'
      }
    },
    uglify: {
      build: {
        files: {
          'build/contextBar.min.js' : ['build/contextBar.js'],
          'demo/js/contextBar.min.js' : ['build/contextBar.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['concat','uglify']);
};
