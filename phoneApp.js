/**
 * Created by Adam_Kruppa on 7/7/2015.
 */
var app = angular
    .module("phoneApp", ["ngRoute", "ngAnimate"])
    .config(config);

app.constant('NOTE_URL', 'http://localhost:3000/note?fn=');
app.constant('TAG_URL', 'http://localhost:3000/tag?fn=');

function config($routeProvider) {
    $routeProvider
        .when('/', {
            controller: 'AppCtrl',
            controllerAs: 'appctrl',
            templateUrl: 'templates/main.html',
            resolve: {
                notes : function(noteService) {
                    return noteService.getNote();
                },
                tags : function(tagService) {
                    return tagService.getTag();
                }
            }
        });
}

app.controller("AppCtrl", function(noteService, tagService, notes, tags, $scope) {
    notes = JSON.parse(notes);
    tags = JSON.parse(tags);

    $scope.toggle = false;
    $scope.notes = notes;
    $scope.allTags = tags;

    if(notes.length == 0) {
        var promise = noteService.createNote("New note");
        promise.then(function(note) {
            $scope.notes.push(note)
        });
    }
});

app.directive("notes", function(noteService, alertService) {
    return {
        templateUrl: "templates/notes.html",
        restrict: "E",
        scope: {
            "notes":"=",
            "tages":"="
        },
        controller: function($scope) {
            $scope.changeColor = function (color) {
                return noteService.updateNote(this.item._id, null, color);
            };
            $scope.addNewNote = function() {
                var promise = noteService.createNote("New note");
                promise.then(function(note) {
                    $scope.notes.push(note);
                    alertService.showAlert("New note added");
                });
            };
            $scope.getTags = function() {
                return $scope.tages;
            }
        }
    }
});

app.directive("myNote", function(noteService, tagService, alertService) {
    return {
        restrict : 'E',
        require: ['^notes'],
        scope: {
            item: '=myNote',
            addNewNote: '&',
            saveNotes:"&",
            getTags:"&",
            changeColor:"=",
            note:"=",
            noteId: "@",
            notes: "="
        },
        templateUrl: 'templates/note.html',
        controller: function($scope, $element) {
            $scope.changeNoteTitle = function(title, $event) {
                if($event && $event.which != 13) {
                    return;
                }
                var promise = noteService.updateNote(this.item._id, title);
                promise.then(function(x) {
                    alertService.showAlert("Note updated");
                });
            };

            $scope.deleteNote = function() {
                var promise = noteService.deleteNote(this.item._id);
                promise.then(function() {
                    $element.remove();
                    alertService.showAlert("Note deleted");
                });
            };

            var tags = $scope.getTags();
            $scope.newTag = "Enter new tag";
            $scope.colors = ["#ff00ff", "#fff000" , "#0000ff", "#00ffff", "#ff0000", "#00ff00"];

            $scope.tags = [{description:"Add new tag"}];

            _.each(tags, function(tag) {
                if(tag.noteId == $scope.noteId) {
                    $scope.tags.push(tag) ;
                }
            });

            $scope.changeNoteColor = function(color) {
                var promise = $scope.changeColor(color);
                promise.then(function() {
                    $element.css("background-color", color);
                    alertService.showAlert();
                    $scope.toggle = true;
                })
            }

        },
        link: function(scope, element, attrs, ctrls) {
            element.css("background-color", attrs.noteColor).css("top", scope.item.posY+"px").css("left", scope.item.posX+"px");
        }

    };
});

app.directive("tags", function(noteService, tagService, alertService) {
    return {
        templateUrl: "templates/tags.html",
        restrict: "E",
        scope: {
            tags: "=",
            noteId:"@"
        },
        controller: function($scope, $element) {
            $scope.changeTag = function( newTag, $event) {
                if($event && $event.which != 13) {
                    return;
                } debugger;

                if(newTag._id) {
                    var promise = tagService.updateTag(newTag._id, newTag.description, newTag.isDone);
                    promise.then(function() {
                        alertService.showAlert("Tag updated");
                    })
                }
                else {
                    var tagObj = {noteId: $scope.noteId, description:newTag.description };
                    var promise = tagService.createTag(tagObj.noteId, tagObj.description);
                    promise.then(function(result) {
                        tagObj._id = result._id;
                        $scope.tags.push(tagObj);
                        alertService.showAlert("Tag created");
                    })
                }
            };

            $scope.deleteTag = function(tag) {
                var promise  = tagService.deleteTag(tag._id);
                promise.then(function() {
                    var index = $scope.tags.indexOf(tag);
                    $scope.tags = _.without( $scope.tags, _.findWhere( $scope.tags, {id: index}));
                })
                return promise;
            };

            $scope.changeTagDone = function(tag) {
                var promise =  tagService.updateTag(tag._id, tag.description, tag.isDone);
                promise.then(function() {
                    for(var i = 0;i<$scope.tags.length;++i) {
                        if($scope.tags[i]._id == tag._id) {
                            $scope.tags[i].isDone = tag.isDone ? "true" : "false";
                            break;;
                        }
                    }
                })
                return promise;
            };
        }
    }
});

app.directive("myTag", function(alertService) {
    return {
        restrict: "E",
        templateUrl: "templates/tag.html",
        require:'^tags',
        scope: {
            item: '=myItem',
            test1:'&',
            noteId:'@',
            changeTag:'=',
            deleteTag:'=',
            changeTagDone:'=',
            tags:"="
        },
        controller: function($scope, $element) {
            $scope.deleteMyTag = function(tag) {
                var promise = $scope.deleteTag(tag);
                promise.then(function() {
                    $element.remove();
                    alertService.showAlert("Tag removed");
                })
            }
            $scope.tagFocus = function(tag) {
                if(!tag._id) {
                    tag.description = "";
                }
            };
            $scope.tagBlur = function(tag) {
                if(!tag._id) {
                    tag.description = "Add new tag";
                }
            };
            $scope.changeMyTagDone = function(tag) {
                tag.isDone = tag.isDone == "true" ? true : false;
                var checked = !tag.isDone;
                tag.isDone = checked;
                var promise = $scope.changeTagDone(tag);

                promise.then(function() {
                    if(checked) {
                        $element.parent().addClass("isDone");
                    }
                    else{
                        $element.parent().removeClass("isDone");
                    }
                });
            };
        },
        link: function($scope, element) {
            if($scope.item.isDone) {
                 if($scope.item.isDone == "true") {
                     element.parent().addClass("isDone");
                 }
            }
        }
    }
});

app.directive("colorBlock", function() {
    return {
        restrict: "E",
        scope: {
            changeColor:"&"
        },
        link:function($scope, element, attrs) {
            angular.element(element).css("background-color", attrs.bgColor)
        }
    }
});

app.directive('myAlert', function(){
    return {
        restrict: 'E',
        scope: { },
        template: '<div class="alert-div toggle {{alertClass}}" data-val="{{title}}" ng-if="toggle">{{title}}</div>',
        controller: function($scope) {
            $scope.$on('alert', function(event, alertOptions) {
                $scope.toggle = alertOptions.show;
                $scope.title = alertOptions.title;
                $scope.alertClass = alertOptions.classType;
            });
        }
    }
});

app.directive('myDraggable', ['$document', 'noteService', function($document, noteService) {
    return {
        link: function(scope, element, attr) {
            var startX = 0, startY = 0, x = parseInt(element.css("left")), y = parseInt(element.css("top")), mouseIsMoving = false;

            element.css({
                position: 'relative',
                border: '1px solid red',
                cursor: 'pointer'
            });

            element.on('mousedown', function(event) {
                //event.preventDefault();
                startX = event.pageX - x;
                startY = event.pageY - y;
                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            function mousemove(event) {
                mouseIsMoving = true;
                y = event.pageY - startY;
                x = event.pageX - startX;
                element.css({
                    top: y + 'px',
                    left:  x + 'px'
                });
            }

            function mouseup(event) {
                $document.off('mousemove', mousemove);
                $document.off('mouseup', mouseup);
                var y = event.pageY - startY;
                var x = event.pageX - startX;
                if(mouseIsMoving) {
                    noteService.updateNotePosition(element.attr("note-id"), x, y);
                }
                mouseIsMoving = false;
            }
        }
    };
}]);

app.service(
    "noteService",
    function( $http, $q, NOTE_URL ) {

        return ({
            createNote: createNote,
            getNote: getNote,
            updateNote: updateNote,
            updateNotePosition: updateNotePosition,
            deleteNote: deleteNote
        });

        function createNote(name) {

            var request = $http({
                method: "post",
                url: NOTE_URL + "create",
                params: {
                    title: name
                }
            });

            return ( request.then(handleSuccess, handleError) );
        }

        function deleteNote(id) {
            var request = $http({
                method: "post",
                url: id != undefined ? NOTE_URL + "delete&id="+id : NOTE_URL + "deleteAll"
            });

            return( request.then( handleSuccess, handleError ) );
        }

        function getNote(id) {

            var request = $http({
                method: "get",
                url: id != undefined ? NOTE_URL + "read&id=559bc178364f9d101ec3c0a7" : NOTE_URL + "readAll",
                params: {
                    action: "get"
                }
            });

            return( request.then( handleSuccess, handleError ) );
        }

        function updateNote(id, title, color) {

            var request = $http({
                method: "post",
                url: NOTE_URL + "update",
                params: {
                    id: id,
                    title: title,
                    color: color
                }
            });

            return( request.then( handleSuccess, handleError ) );
        }

        function updateNotePosition(id, posX, posY) {

            var request = $http({
                method: "post",
                url: NOTE_URL + "updatePosition",
                params: {
                    id: id,
                    posX: posX,
                    posY: posY
                }
            });

            return( request.then( handleSuccess, handleError ) );
        }

        function handleError( response ) {
            if (
                ! angular.isObject( response.data ) ||
                ! response.data.message
            ) {

                return( $q.reject( "An unknown error occurred." ) );
            }

            return( $q.reject( response.data.message ) );

        }
        function handleSuccess( response ) {
            return( response.data );

        }
    });

app.service(
    "tagService",
    function( $http, $q, TAG_URL ) {

        // Return public API.
        return ({
            createTag: createTag,
            getTag: getTag,
            getByNoteId: getByNoteId,
            updateTag: updateTag,
            deleteTag: deleteTag
        });

        function createTag(noteId, description) {
            var request = $http({
                method: "post",
                url: TAG_URL + "create",
                params: {
                    noteId: noteId,
                    description: description
                 }
            });

            return ( request.then(handleSuccess, handleError) );
        }

        function deleteTag(id) {

            var request = $http({
                method: "post",
                url: id != undefined ? TAG_URL + "delete&id="+id : TAG_URL + "deleteAll"
            });

            return( request.then( handleSuccess, handleError ) );
        }

        function getTag(id) {

            var request = $http({
                method: "get",
                url: id != undefined ? TAG_URL + "read" : TAG_URL + "readAll",
                params: {
                    id: id
                }
            });

            return( request.then( handleSuccess, handleError ) );
        }

        function getByNoteId(noteId) {

            var request = $http({
                method: "get",
                url:  TAG_URL + "getByNoteId",
                params: {
                    noteId: noteId
                }
            });

            return( request.then( handleSuccess, handleError ) );
        }

        function updateTag(id, description, isChecked) {
            var request = $http({
                method: "post",
                url: TAG_URL + "update",
                params: {
                    id: id,
                    description: description,
                    isDone: isChecked
                }
            });

            return( request.then( handleSuccess, handleError ) );

        }

        function handleError( response ) {
            if (
                ! angular.isObject( response.data ) ||
                ! response.data.message
            ) {

                return( $q.reject( "An unknown error occurred." ) );
            }

            return( $q.reject( response.data.message ) );

        }

        function handleSuccess( response ) {
            return( response.data );

        }
    });

app.service(
    "alertService",
    function($rootScope, $timeout) {
        return {
            showAlert: showAlert
        };

        function showAlert(title, classType, time) {
            var alertOptions = {
                title: title || "Successful modification",
                classType: classType || "alert-normal",
                time: time || 1000,
                show: true
            }

            $rootScope.$broadcast('alert', alertOptions);
            $timeout(function() {
                alertOptions.show = false;
                $rootScope.$broadcast('alert', alertOptions);
            }, alertOptions.time);
        }
    }
);
