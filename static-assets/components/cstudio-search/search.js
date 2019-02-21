/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function (window, $, Handlebars) {
    'use strict';

    if (typeof window.CStudioSearch == "undefined" || !window.CStudioSearch) {
        var CStudioSearch = {};
        window.CStudioSearch = CStudioSearch;
    }

    /* default search context */
    CStudioSearch.searchContext = {
        searchId: null,
        itemsPerPage: 20,
        keywords: "",
        filters: {},
        sortBy: "internalName",      // sortBy has value by default, so numFilters starts at 1
        sortOrder: "asc",
        numFilters: 1,
        currentPage: 1,	
        searchInProgress: false,
        view: 'grid'
    };

    CStudioSearch.typesMap = {
        Page: 'fa-file',
        Component: 'fa-puzzle-piece',
        Template: 'fa-file-code-o',
        Taxonomy: 'fa-tag',
        Other: 'fa-file-text',
        Image: 'fa-file-image-o',
        Video: 'fa-file-video-o',
        CSS: 'fa-css3',
        JavaScript: 'fa-file-code-o',
        Groovy: 'fa-file-code-o',
        PDF: 'fa-file-pdf-o',
        "MS WORD": 'fa-file-word-o',
        "MS EXCEL": 'fa-file-excel-o',
        "MS PowerPoint": 'fa-file-powerpoint-o'
    }

    // TODO: validate if needed (videos filters are pending)
    CStudioSearch.facetsMap = {
        width: 'images',
        height: 'images'
    }

    CStudioSearch.init = function() {
        var searchContext = this.determineSearchContextFromUrl();
        this.searchContext = searchContext;

        // var CMgs = CStudioAuthoring.Messages,
        //     browseLangBundle = CMgs.getBundle("browse", CStudioAuthoringContext.lang);

        this.performSearch();
        this.bindEvents();
    };

    CStudioSearch.bindEvents = function() {
        var searchTimeout;

        // Search input changes
        $('#searchInput').on('keyup', function(e){
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function(){
                CStudioSearch.searchContext.keywords = e.target.value;
                CStudioSearch.performSearch();
                CStudioSearch.updateUrl();
            }, 700);
        });

        // Selecting an item from the results
        $('.cstudio-search').on('change', '.search-select-item', function(){
            var path = $(this).attr('data-url'),
                selected = $(this).is(":checked"),
                allSelected = $('input[type="checkbox"].search-select-item:checked').length == $('input[type="checkbox"].search-select-item').length;
            
            $('#searchSelectAll').prop('checked', allSelected);
                
            CStudioSearch.changeSelectStatus(path, selected);
        });

        // Select all results
        $('.cstudio-search').on('change', '#searchSelectAll', function(){
            var selected = $(this).is(":checked"),
                $elements = $('input[type="checkbox"].search-select-item');

            $elements.prop('checked', selected).trigger("change");
            
        });

        // Clicking on edit icon from the results
        $('.cstudio-search').on('click', '.search-edit', function(e){
            var path = $(this).attr('data-url');
            e.preventDefault();
            CStudioSearch.editElement(path);
        });

        // Clicking on delete icon from the results
        $('.cstudio-search').on('click', '.search-delete', function(e){
            var path = $(this).attr('data-url');
            e.preventDefault();
            CStudioSearch.deleteElement(path);
        });

        // Selecting a filter
        $('.cstudio-search').on('change', '.filter-item input[type="radio"]', function(){
            var filterName = $(this).attr('name'),
                filterValue = $(this).val(),
                isAdditional = $(this).hasClass('filter');
            
            if(isAdditional){
                CStudioSearch.searchContext.filters[filterName] = isNaN(parseInt(filterValue)) ? filterValue : parseInt(filterValue); 
            }else{
                CStudioSearch.searchContext[filterName] = filterValue;
            }
            
            CStudioSearch.updateNumFilters();
            CStudioSearch.performSearch(true);
            CStudioSearch.updateUrl();
        });

        $('.cstudio-search').on('click', '.filters .clear-filter', function(){
            var filterId = $(this).parent().attr('id');
            $('input[name="' + filterId + '"]').prop('checked', false);

            delete CStudioSearch.searchContext.filters[filterId];
            
            CStudioSearch.performSearch(true);
            CStudioSearch.updateUrl();
        });

        // Changing results view (grid, list)
        $('.view-selector').on('click',  'button', function(){
            var $resultsContainer = $('.results'),
                newView = $(this).attr('data-view'),
                oldView = newView === 'grid' ? 'list' : 'grid';
            
            CStudioSearch.searchContext.view = newView;
            $('.view-selector button').removeClass('active');
            $(this).addClass('active');

            $resultsContainer.switchClass(oldView, newView);    
        });

        // Clicking on result to preview
        $('.cstudio-search').on('click', '.result-preview.previewable', function() {
            CStudioSearch.previewElement($(this).attr('data-url'));
        });

        // Avoid closing filters dropdown on selections
        $(document).on('click', '.filters .dropdown-menu', function (e) {
            e.stopPropagation();
        });
    };

    //Utilities

    CStudioSearch.determineSearchContextFromUrl = function() {
        var searchContext = CStudioSearch.searchContext;
        
        var queryString = document.location.search;
        
        var keywords = CStudioAuthoring.Utils.getQueryVariable(queryString, "keywords");
        var searchId = CStudioAuthoring.Utils.getQueryVariable(queryString, "searchId");
        var itemsPerPage = CStudioAuthoring.Utils.getQueryVariable(queryString, "ipp");
        var page = CStudioAuthoring.Utils.getQueryVariable(queryString, "page");
        var sortBy = CStudioAuthoring.Utils.getQueryVariable(queryString, "sortBy");
    
        searchContext.keywords = (keywords) ? keywords : searchContext.keywords;
        searchContext.searchId = (searchId) ? searchId : null;
        searchContext.currentPage = (page) ? page : searchContext.currentPage;
        searchContext.sortBy = (sortBy) ? sortBy : searchContext.sortBy;
            
        if(!CStudioAuthoring.Utils.isEmpty(itemsPerPage)) {
            searchContext.itemsPerPage = itemsPerPage;	
        }
        else {		
            searchContext.itemsPerPage = 20;	
        }
        
        return searchContext;
    }

    CStudioSearch.renderResults = function(results) {
        var $resultsContainer = $('.cstudio-search .results'),
            $resultsPagination = $('#resultsPagination'),
            $numResultsContainer = $('#searchNumResults'),
            totalItems = results.total,
            itemsPerPage = this.searchContext.itemsPerPage,
            totalPages = Math.ceil(totalItems/itemsPerPage);
        $resultsContainer.empty();

        this.searchContext.facets = results.facets;     // for filters
        CStudioSearch.cleanFilters();
        this.initFilters();

        $numResultsContainer.text(results.total);

        //PAGINATION - https://www.jqueryscript.net/other/Simple-Boostrap-Pagination-Plugin-With-jQuery.html
        if(!this.$pagination){
            this.$pagination = $resultsPagination.simplePaginator({
                totalPages: totalPages,
                maxButtonsVisible: 5,
                currentPage: parseInt(this.searchContext.currentPage),
                clickCurrentPage: false,
                nextLabel: 'Next',
                prevLabel: 'Prev',
                firstLabel: 'First',
                lastLabel: 'Last',
                pageChange: function(page){
                    CStudioSearch.searchContext.currentPage = page;
                    CStudioSearch.performSearch();
                }
            });
        }else{
            if(totalPages > 0){
                $resultsPagination.show();
                this.$pagination.simplePaginator('setTotalPages', totalPages);
            }else{
                $resultsPagination.hide();
            }
        }
        // END OF PAGINATION

        $.each(results.items, function(index, result){
            CStudioSearch.renderResult(result);
        });
    }

    // TODO: Needs to be improved - filters, more params, etc
    CStudioSearch.createSearchQuery = function() {        
        var searchContext = this.searchContext;
        var query = {
            "keywords": searchContext.keywords,
            "offset": (searchContext.currentPage - 1) * searchContext.itemsPerPage,
            "limit": searchContext.itemsPerPage,
            "sortBy": searchContext.sortBy,
            "sortOrder": searchContext.sortOrder
        }

        if(!jQuery.isEmptyObject( searchContext.filters )) {
            query.filters = {};
            $.each(searchContext.filters, function(key, value){
                query.filters[key] = value;
            })
        }

        return query;
    }

    CStudioSearch.initFilters = function() {
        var searchContext = this.searchContext,
            $sortFilters = $('#searchFilters .dropdown-menu .sort-dinam'),
            filterItem;

        // handlebars vars
        var source = $("#hb-filter-item").html(),
            template = Handlebars.compile(source),
            html,
            separatorSrc = $("#hb-filter-separator").html(),
            separatorTemplate = Handlebars.compile(separatorSrc),
            separatorHtml = separatorTemplate(),
            headerSrc = $('#hb-filter-section').html(),
            headerTemplate = Handlebars.compile(headerSrc),
            headerHtml;

        // Update searchInput value from searchContext
        $('#searchInput').val(searchContext.keywords);

        // sortOrder
        var sortOrderValue = searchContext.sortOrder;
        $('#' + sortOrderValue).prop("checked", true);

        // sortBy
        var sortByValue = searchContext.sortBy;
        $.each(searchContext.facets, function(index, facet){
            var label = (facet.name).replace(/-/g, " ");
            label = label.replace(/([A-Z])/g, ' $1').trim();
            label = label.replace(/\b[a-z]/g, function(letter) {
                return letter.toUpperCase();
            });

            filterItem = {
                name: 'sortBy',
                value: facet.name,
                id: facet.name,
                label: label
            }

            html = template(filterItem);
            $(html).appendTo($sortFilters);
        });
        $('#' + sortByValue).prop("checked", true);

        // add filters
        $.each(searchContext.facets, function(index, facet){
            var groupedFacetsName = CStudioSearch.facetsMap[facet.name] ? CStudioSearch.facetsMap[facet.name] : null,
                containerClass = groupedFacetsName ? groupedFacetsName : 'other',
                $container = $('#searchFilters .dropdown-menu .' + containerClass),
                headerExists = $container.find('.dropdown-header').length > 0;

            // Filters for images and videos, for example, are grouped
            if(groupedFacetsName && !headerExists){
                headerHtml = headerTemplate({ 
                    value: groupedFacetsName,
                    label: groupedFacetsName,
                    main: groupedFacetsName
                })
                $(headerHtml).appendTo($container);  
            }else{
                $(separatorHtml).appendTo($container);
            }

            headerHtml = headerTemplate({ 
                value: facet.name,
                label: facet.name,
                main: !groupedFacetsName,
                clear: true
            })
            $(headerHtml).appendTo($container);

            $.each(facet.values, function(key, value){
                var escapedKey = key.replace(/\//g, "_");

                filterItem = {
                    name: facet.name,
                    value: isNaN(parseInt(key)) ? key : parseInt(key),
                    id: isNaN(parseInt(escapedKey)) ? escapedKey : parseInt(escapedKey),
                    label: key,
                    filter: true
                }

                html = template(filterItem);
                $(html).appendTo($container);
            });

        });

        $.each(CStudioSearch.searchContext.filters, function(key, value){
            var escapedValue = value.replace ? value.replace(/\//g, "_") : value;
            $('input[type="radio"][name="' + key + '"]#' + escapedValue).prop("checked", true);
        });

        this.updateNumFilters();
    }

    CStudioSearch.cleanFilters = function(){
        $('#searchFilters .dropdown-menu .sort-dinam').empty();
        $('#searchFilters .dropdown-menu .images').empty();
        $('#searchFilters .dropdown-menu .videos').empty();
        $('#searchFilters .dropdown-menu .other').empty();
    }

    CStudioSearch.updateNumFilters = function(){
        // SortBy will always have a value -> minimum filters = 1
        this.searchContext.numFilters = 1 + Object.keys(CStudioSearch.searchContext.filters).length;
        $('#numFilters').text('(' + this.searchContext.numFilters + ')')
    }

    // Before calling this function the searchContext needs to be updated so 
    // it can create an updated searchQuery
    CStudioSearch.performSearch = function(clean) {
        if(clean){
            CStudioSearch.searchContext.currentPage = 1;
        }
        var searchQuery = this.createSearchQuery();

        var callback = {
            success: function (response) {
                CStudioSearch.renderResults(response.result);
            },
            failure: function (error) {
                console.error(error);
            }
        }
        CStudioAuthoring.Service.search(CStudioAuthoringContext.site, searchQuery, callback);
    }

    CStudioSearch.renderResult = function(result) {
        var $resultsContainer = $('.cstudio-search .results'),
            source = $("#hb-search-result").html(),
            template = Handlebars.compile(source),
            html,
            editPermission = true;

        if(
            result.type === "Page"
            || result.type === "Image"
            || result.type === "Video"
        ){  
            result.previewable = true;
        }

        if (result.path.indexOf(".ftl") == -1
            && result.path.indexOf(".css") == -1
            && result.path.indexOf(".js") == -1
            && result.path.indexOf(".groovy") == -1
            && result.path.indexOf(".txt") == -1
            && result.path.indexOf(".html") == -1
            && result.path.indexOf(".hbs") == -1
            && result.path.indexOf(".xml") == -1) {
            editPermission = false;
        }

        if(result.type !== 'Page' && result.type !== 'Component' && result.type !== 'Taxonomy' && result.type !== 'Image') {
            result.asset = true;
        }
        result.icon = CStudioSearch.typesMap[result.type];

        // result.name = result.path.split(/[\\\/]/).pop();
        result.editable = editPermission;
        html = template(result);
        
        $(html).appendTo($resultsContainer);
    }

    CStudioSearch.changeSelectStatus = function(path, selected){
        var callback = {
            success: function (contentTO) {
                if (selected == true) {
                    CStudioAuthoring.SelectedContent.selectContent(contentTO.item);
                }
                else {
                    CStudioAuthoring.SelectedContent.unselectContent(contentTO.item);
                }
            },
            failure: function (error) {
                console.error(error);
            }
        }

        CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, path, callback, false, false);
    }

    CStudioSearch.editElement = function(path){
        var editCallback = {
                success: function(){
                    CStudioSearch.performSearch();      // to re-render with changes
                }
            },
            callback = {
            success: function (contentTO) {
                var contentTO = contentTO.item;
                CStudioAuthoring.Operations.editContent(
                    contentTO.form,
                    CStudioAuthoringContext.siteId,
                    contentTO.uri,
                    contentTO.nodeRef,
                    contentTO.uri,
                    false,
                    editCallback);
            },
            failure: function (error) {
                console.error(error);
            }
        }

        CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, path, callback, false, false);
    }

    CStudioSearch.deleteElement = function(path){
        // TODO: reload items on deletion
        var callback = {
            success: function (contentTO) {
                var contentTO = contentTO.item;

                CStudioAuthoring.Operations.deleteContent(
                    [contentTO]);
            },
            failure: function (error) {
                console.error(error);
            }
        }

        CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, path, callback, false, false);
    }

    CStudioSearch.previewElement = function(url){
        CStudioAuthoring.Service.lookupContentItem(
            CStudioAuthoringContext.site, 
            url, 
            { success:function(to) { 
                CStudioAuthoring.Operations.openPreview(to.item, 'undefined', false, false); 
            }, 
            failure: function() {} 
        }, false);
    }

    CStudioSearch.updateUrl = function(){
        //TODO: handle filters

        var searchContext = this.searchContext,
            newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?site=' + CStudioAuthoringContext.site;

        newUrl += '&page=' + searchContext.currentPage;
        newUrl += '&searchId=' + searchContext.searchId;
        newUrl += '&sortBy=' + searchContext.sortBy;
        newUrl += '&keywords=' + searchContext.keywords;
        
        window.history.pushState({path:newUrl},'',newUrl);
    }

}) (window, jQuery, Handlebars);
