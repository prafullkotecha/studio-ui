/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { LookupTable } from './LookupTable';
import { User } from './User';
import { Site } from './Site';
import ContentType from './ContentType';
import { WidthAndHeight } from './WidthAndHeight';
import PreviewTool from './PreviewTool';
import { ElasticParams, MediaItem } from './Search';
import ContentInstance from './ContentInstance';
import { ContentTypeReceptacle } from './ContentTypeReceptacle';
import { ConfirmDialogStateProps } from '../components/Dialogs/ConfirmDialog';
import { ErrorDialogStateProps } from '../components/SystemStatus/ErrorDialog';
import { MinimizedDialogsStateProps } from './MinimizedDialog';
import { NewContentDialogStateProps } from '../modules/Content/Authoring/NewContentDialog';
import { HistoryDialogStateProps } from '../modules/Content/History/HistoryDialog';
import { PublishDialogStateProps } from '../modules/Content/Publish/PublishDialog';
import { DependenciesDialogStateProps } from '../modules/Content/Dependencies/DependenciesDialog';
import { DeleteDialogStateProps } from '../modules/Content/Delete/DeleteDialog';
import { EntityState } from './EntityState';
import { ApiResponse } from './ApiResponse';
import { EmbeddedLegacyEditorsStateProps } from '../modules/Preview/EmbeddedLegacyEditors';
import { ViewVersionDialogStateProps } from '../modules/Content/History/ViewVersionDialog';
import { CompareVersionsDialogStateProps } from '../modules/Content/History/CompareVersionsDialog';
import { VersionsStateProps } from './Version';
import { SystemInformation } from './SystemInformation';

export interface PagedEntityState<T = any> extends EntityState<T> {
  page: any;
  pageNumber: number;
  count: number;
  query: ElasticParams;
}

export interface EditSelection {
  modelId: string;
  fieldId: string[];
  index: string | number;
}

export interface GuestData {
  url: string;
  origin: string;
  location: string;
  models: LookupTable<ContentInstance>;
  childrenMap: LookupTable<string[]>;
  modelId: string;
  selected: EditSelection[];
  itemBeingDragged: boolean;
}

export interface GlobalState {
  auth: {
    error: ApiResponse;
    isFetching: boolean;
    active: boolean;
  };
  user: User;
  sites: {
    active: string;
    isFetching: boolean;
    byId: LookupTable<Site>;
  };
  contentTypes: EntityState<ContentType>;
  env: {
    AUTHORING_BASE: string;
    GUEST_BASE: string;
    XSRF_CONFIG_HEADER: string;
    XSRF_CONFIG_ARGUMENT: string;
    SITE_COOKIE: string;
    PREVIEW_LANDING_BASE: string;
    SYSTEM_INFORMATION: {
      isFetching: boolean;
      error: ApiResponse;
      version: SystemInformation
    };
  };
  preview: {
    currentUrl: string;
    computedUrl: string;
    showToolsPanel: boolean;
    selectedTool: PreviewTool;
    previousTool: PreviewTool;
    tools: Array<any>;
    hostSize: WidthAndHeight;
    guest: GuestData;
    assets: PagedEntityState<MediaItem>;
    audiencesPanel: {
      isFetching: boolean;
      isApplying: boolean;
      error: ApiResponse;
      contentType: ContentType;
      model: ContentInstance;
      applied: boolean;
    };
    components: PagedEntityState<ContentInstance>;
    receptacles: {
      selectedContentType: string;
      byId: LookupTable<ContentTypeReceptacle>;
    };
  };
  versions: VersionsStateProps;
  dialogs: {
    confirm: ConfirmDialogStateProps;
    error: ErrorDialogStateProps;
    minimizedDialogs: MinimizedDialogsStateProps;
    newContent: NewContentDialogStateProps;
    history: HistoryDialogStateProps;
    viewVersion: ViewVersionDialogStateProps;
    compareVersions: CompareVersionsDialogStateProps;
    publish: PublishDialogStateProps;
    dependencies: DependenciesDialogStateProps;
    delete: DeleteDialogStateProps;
    edit: EmbeddedLegacyEditorsStateProps;
  };
}

export default GlobalState;
