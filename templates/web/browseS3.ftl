<!--
  ~ Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
  ~
  ~ This program is free software: you can redistribute it and/or modify
  ~ it under the terms of the GNU General Public License as published by
  ~ the Free Software Foundation, either version 3 of the License, or
  ~ (at your option) any later version.
  ~
  ~ This program is distributed in the hope that it will be useful,
  ~ but WITHOUT ANY WARRANTY; without even the implied warranty of
  ~ MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  ~ GNU General Public License for more details.
  ~
  ~ You should have received a copy of the GNU General Public License
  ~ along with this program.  If not, see <http://www.gnu.org/licenses/>.
  -->

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Crafter Studio</title>
    <#include "/templates/web/common/page-fragments/head.ftl" />
    <#include "/templates/web/common/page-fragments/studio-context.ftl" />

    <link rel="stylesheet" href="/static-assets/css/bootstrap.css">
    <link rel="stylesheet" type="text/css" href="/studio/static-assets/styles/browse.css" />

    <link rel="stylesheet" href="/studio/static-assets/libs/jQuery-contextMenu-master/dist/jquery.contextMenu.css" type="text/css">

    <script src="/studio/static-assets/libs/jquery/dist/jquery.js"></script>
    <script src="/studio/static-assets/libs/handlebars/handlebars.js"></script>
    <script src="/studio/static-assets/libs/jstree/dist/jstree.js"></script>


    <script src="/studio/static-assets/libs/jQuery-contextMenu-master/dist/jquery.contextMenu.js" type="text/javascript"></script>
    <script src="/studio/static-assets/libs/jQuery-contextMenu-master/dist/jquery.ui.position.js" type="text/javascript"></script>


    <script type="text/javascript" src="/studio/static-assets/components/cstudio-browse/browse.js"></script>
    <script type="text/javascript" src="/studio/static-assets/components/cstudio-browse/browseS3.js"></script>
    <link rel="stylesheet" type="text/css" href="/studio/static-assets/libs/jstree/dist/themes/default/style.css" />
    <link href="/studio/static-assets/themes/cstudioTheme/css/icons.css" type="text/css" rel="stylesheet">

    <#assign path="/studio/static-assets/components/cstudio-common/resources/" />
    <script src="${path}en/base.js?version=${UIBuildId!.now?string('Mddyyyy')}"></script>
    <script src="${path}kr/base.js?version=${UIBuildId!.now?string('Mddyyyy')}"></script>
    <script src="${path}es/base.js?version=${UIBuildId!.now?string('Mddyyyy')}"></script>
    <script src="${path}de/base.js?version=${UIBuildId!.now?string('Mddyyyy')}"></script>

    <script>
        var CMgs = CStudioAuthoring.Messages,
            browseLangBundle = CMgs.getBundle("browse", CStudioAuthoringContext.lang);
    </script>

  </head>

  <body class="yui-skin-cstudioTheme skin-browse browse-cmis">

  <div class="tabs">

      <ul class="tab-links">
          <li class="active"><a href="#tab1">Browse</a></li>
      </ul>

      <div class="tab-content">
          <div id="tab1" class="tab active cstudio-browse-container">

              <p class="current-folder">
                  <span class="path"></span>
              </p>

              <div id="cstudio-wcm-search-filter-controls">
                  <div id="data" class="demo"></div>
              </div>

              <div id="cstudio-wcm-browse-result" class="cstudio-wcm-result">

                  <div class="cstudio-results-actions"></div>

                  <div class="results"></div>

                  <div id="cstudio-wcm-browse-render-finish">

                  </div>
              </div>

          </div>
      </div>

  </div>



    <div id="cstudio-command-controls">
      <div id="submission-controls" class="cstudio-form-controls-button-container">
        <input id="formCancelButton" type="button" class="cstudio-search-btn cstudio-button btn btn-default" value="Cancel">

        
      </div>
    </div>

  <div class="cstudio-image-popup-overlay">
      <div class="cstudio-image-pop-up">
          <div>
              <span class="close fa fa-close"></span>
          </div>
          <img src="">
          <video id="videoOverlay" controls="true" >
              <source src="" type="">
          </video>
      </div>
  </div>

     <script id="hb-search-result" type="text/x-handlebars-template">
        <div class="cstudio-search-result clearfix">
            <div class="cstudio-result-body row" style="overflow: hidden;">
              <div class="{{#if media}} cstudio-search-result-description result-cmis {{else}} cstudio-search-result-description-cmis {{/if}}">
                <span class="cstudio-search-component cstudio-search-component-title-nopreview {{#if disabled}}disabled{{/if}}">
                {{#if internalName}}
                  {{internalName}}
                {{else}}
                  {{name}}
                {{/if}}
                </span>

                {{#if showUrl}}
                <span class="cstudio-search-component cstudio-search-component-url">
                  <span class="component-title bold">{{labelUrl}}:</span>
                  <span>{{browserUri}}</span>
                </span>
                {{/if}}


                <span class="cstudio-search-component cstudio-search-component-type">
                  <span class="component-title bold">{{labelType}}:</span>
                  {{mimeType}}
                </span>

                <div>
                    <span class="cstudio-search-component cstudio-search-component-button">
                        <a class="btn btn-default cstudio-search-btn add-link-btn results-btn" href="#" role="button">{{labelAddLink}}</a>
                    </span>
                </div>
              </div>
              {{#equal type "image"}}
                <div class="cstudio-search-description-preview">
                    <img src="{{browserUri}}" alt="{{name}}" class="cstudio-search-banner-image">
                    <img src="/studio/static-assets/themes/cstudioTheme/images/magnify.jpg" class="magnify-icon" style="position: absolute; right: 0; bottom: 0;" data-source="{{browserUri}}" data-type="{{mimeType}}" >
                </div>
              {{/equal}}
              {{#equal type "video"}}
                <div class="cstudio-search-description-preview">
                    <video class="cstudio-search-banner-image" src="{{browserUri}}" type="{{mimeType}}" controls="true"></video>
                    <img src="/studio/static-assets/themes/cstudioTheme/images/magnify.jpg" class="magnify-icon" style="position: absolute; right: 0; bottom: 0;" data-source="{{browserUri}}" data-type="{{mimeType}}">
                </div>
              {{/equal}}
            </div>
          </div>
    </script>

    <script id="hb-search-results-actions-buttons" type="text/x-handlebars-template">
      {{#if onlyClear}}
      <a class="cstudio-search-btn btn btn-default cstudio-search-select-all results-btn" href="#" role="button" style="margin-right: 10px; margin-bottom: 20px">{{labelSelectAll}}</a>
      {{/if}}
      <a class="cstudio-search-btn btn btn-default cstudio-search-clear-selection results-btn" href="#" role="button" style="margin-bottom: 20px;">{{labelClearAll}}</a>
    </script>
    
    <script type="text/javascript">
      Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if( lvalue!=rvalue ) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
      });
    </script>

    <script type="text/javascript">
        $(function() {
            CStudioBrowseS3.init();
        });

    </script>

    <script type="text/javascript">
      Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if( lvalue!=rvalue ) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
      });
    </script>
  
   </body>

</html>
