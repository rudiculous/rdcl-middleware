"use strict";

module.exports = function(grunt) {
    /**
     * @task groc
     */
    grunt.task.registerTask('groc', 'Creates project documentation.',
        function() {
            var done = this.async();
            require('groc').CLI([], function(err) {
                if (err) {
                    done(err);
                }
                else {
                    done();
                }
            });
        });
};
