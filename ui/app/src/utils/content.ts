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

import { BaseItem, DetailedItem, ItemActionsMap, ItemStateMap, LegacyItem, SandboxItem } from '../models/Item';
import { getStateMapFromLegacyItem } from './state';
import { nnou, reversePluckProps } from './object';
import { ContentType, ContentTypeField } from '../models/ContentType';
import LookupTable from '../models/LookupTable';
import ContentInstance from '../models/ContentInstance';
import { deserialize, getInnerHtml, getInnerHtmlNumber, wrapElementInAuxDocument } from './xml';
import { fileNameFromPath, unescapeHTML } from './string';
import { getRootPath, isRootPath, withIndex, withoutIndex } from './path';
import { isFolder, isNavigable, isPreviewable } from '../components/PathNavigator/utils';
import {
  CONTENT_CHANGE_TYPE_MASK,
  CONTENT_COPY_MASK,
  CONTENT_CREATE_MASK,
  CONTENT_CUT_MASK,
  CONTENT_DELETE_CONTROLLER_MASK,
  CONTENT_DELETE_MASK,
  CONTENT_DELETE_TEMPLATE_MASK,
  CONTENT_DUPLICATE_MASK,
  CONTENT_EDIT_CONTROLLER_MASK,
  CONTENT_EDIT_MASK,
  CONTENT_EDIT_TEMPLATE_MASK,
  CONTENT_GET_DEPENDENCIES_ACTION_MASK,
  CONTENT_ITEM_UNLOCK,
  CONTENT_PASTE_MASK,
  CONTENT_READ_VERSION_HISTORY_MASK,
  CONTENT_RENAME_MASK,
  CONTENT_REVERT_MASK,
  CONTENT_UPLOAD_MASK,
  FOLDER_CREATE_MASK,
  PUBLISH_APPROVE_MASK,
  PUBLISH_MASK,
  PUBLISH_REJECT_MASK,
  PUBLISH_REQUEST_MASK,
  PUBLISH_SCHEDULE_MASK,
  PUBLISHING_DESTINATION_MASK,
  PUBLISHING_LIVE_MASK,
  PUBLISHING_STAGED_MASK,
  READ_MASK,
  STATE_DELETED_MASK,
  STATE_LOCKED_MASK,
  STATE_MODIFIED_MASK,
  STATE_NEW_MASK,
  STATE_PUBLISHING_MASK,
  STATE_SCHEDULED_MASK,
  STATE_SUBMITTED_MASK,
  STATE_SYSTEM_PROCESSING_MASK,
  STATE_TRANSLATION_IN_PROGRESS_MASK,
  STATE_TRANSLATION_PENDING_MASK,
  STATE_TRANSLATION_UP_TO_DATE_MASK
} from './constants';
import { SystemType } from '../models/SystemType';
import { getStateBitmap } from '../components/ItemStatesManagement/utils';

export function isEditableAsset(path: string) {
  return (
    path.endsWith('.ftl') ||
    path.endsWith('.css') ||
    path.endsWith('.js') ||
    path.endsWith('.groovy') ||
    path.endsWith('.txt') ||
    path.endsWith('.html') ||
    path.endsWith('.hbs') ||
    path.endsWith('.xml') ||
    path.endsWith('.tmpl') ||
    path.endsWith('.htm')
  );
}

export function isAsset(path: string): boolean {
  return (
    path.endsWith('.jpg') ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.gif') ||
    path.endsWith('.pdf') ||
    path.endsWith('.doc') ||
    path.endsWith('.docx') ||
    path.endsWith('.xls') ||
    path.endsWith('.xlsx') ||
    path.endsWith('.ppt') ||
    path.endsWith('.pptx') ||
    path.endsWith('.mp4') ||
    path.endsWith('.avi') ||
    path.endsWith('.webm') ||
    path.endsWith('.mpg')
  );
}

export function isCode(path: string): boolean {
  return (
    path.endsWith('.ftl') ||
    path.endsWith('.css') ||
    path.endsWith('.js') ||
    path.endsWith('.groovy') ||
    path.endsWith('.html') ||
    path.endsWith('.hbs') ||
    path.endsWith('.tmpl') ||
    path.endsWith('.htm')
  );
}

export function isImage(path: string): boolean {
  return (
    path.endsWith('.jpg') ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.gif')
  );
}

export function isItemLockedForMe(item: DetailedItem | SandboxItem | LegacyItem, username: string): boolean {
  return item ? item.lockOwner && item.lockOwner !== username : true;
}

export function getComputedEditMode({
  item,
  username,
  editMode
}: {
  item: DetailedItem;
  username: string;
  editMode: boolean;
}): boolean {
  return isItemLockedForMe(item, username) || !hasEditAction(item.availableActions) ? false : editMode;
}

export function getSystemTypeFromPath(path: string): SystemType {
  const rootPath = getRootPath(path);
  if (rootPath.includes('/site/website')) {
    return 'page';
  } else if (rootPath.includes('/components')) {
    return 'component';
  } else if (rootPath.includes('/taxonomy')) {
    return 'taxonomy';
  } else if (rootPath.includes('/templates')) {
    return 'renderingTemplate';
  } else if (rootPath.includes('/static-assets')) {
    return 'asset';
  } else if (rootPath.includes('script')) {
    return 'script';
  } else {
    return 'unknown';
  }
}

function getLegacyItemSystemType(item: LegacyItem): SystemType {
  switch (true) {
    case item.contentType === 'renderingTemplate': {
      return 'renderingTemplate';
    }
    case item.contentType === 'script': {
      return 'script';
    }
    case item.contentType === 'folder': {
      return 'folder';
    }
    case item.asset || item.isAsset: {
      return 'asset';
    }
    case item.component || item.isComponent: {
      return 'component';
    }
    case item.page || item.isPage: {
      return 'page';
    }
    case item.folder:
    case item.container || item.isContainer: {
      return 'folder';
    }
    case item.contentType === 'taxonomy': {
      return 'taxonomy';
    }
    default: {
      return 'unknown';
    }
  }
}

export function parseLegacyItemToBaseItem(item: LegacyItem): BaseItem {
  const stateMap = getStateMapFromLegacyItem(item);
  const state = getStateBitmap(stateMap);
  return {
    id: item.uri ?? item.path,
    label: item.internalName ?? item.name,
    parentId: null,
    contentTypeId: item.contentType,
    path: item.uri ?? item.path,
    // Assuming folders aren't navigable
    previewUrl: item.uri?.includes('index.xml') ? item.browserUri || '/' : null,
    systemType: getLegacyItemSystemType(item),
    mimeType: item.mimeType,
    state,
    stateMap,
    lockOwner: null,
    disabled: null,
    localeCode: 'en',
    translationSourceId: null,
    availableActions: null,
    availableActionsMap: null
  };
}

export function parseLegacyItemToSandBoxItem(item: LegacyItem): SandboxItem;
export function parseLegacyItemToSandBoxItem(item: LegacyItem[]): SandboxItem[];
export function parseLegacyItemToSandBoxItem(item: LegacyItem | LegacyItem[]): SandboxItem | SandboxItem[] {
  if (Array.isArray(item)) {
    // If no internalName then skipping (e.g. level descriptors)
    return item.flatMap((i) => (i.internalName || i.name ? [parseLegacyItemToSandBoxItem(i)] : []));
  }

  return {
    ...parseLegacyItemToBaseItem(item),
    creator: null,
    dateCreated: null,
    modifier: item.user,
    dateModified: item.lastEditDate,
    commitId: null,
    sizeInBytes: null,
    expiresOn: null
  };
}

export function parseLegacyItemToDetailedItem(item: LegacyItem): DetailedItem;
export function parseLegacyItemToDetailedItem(item: LegacyItem[]): DetailedItem[];
export function parseLegacyItemToDetailedItem(item: LegacyItem | LegacyItem[]): DetailedItem | DetailedItem[] {
  if (Array.isArray(item)) {
    // If no internalName then skipping (e.g. level descriptors)
    return item.flatMap((i) => (i.internalName || i.name ? [parseLegacyItemToDetailedItem(i)] : []));
  }

  return {
    ...parseLegacyItemToBaseItem(item),
    sandbox: {
      creator: null,
      dateCreated: null,
      modifier: item.user,
      dateModified: item.lastEditDate,
      commitId: null,
      sizeInBytes: null,
      expiresOn: null
    },
    staging: {
      lastScheduledDate: item.scheduledDate,
      lastPublishedDate: item.publishedDate,
      publisher: item.user,
      commitId: null,
      expiresOn: null
    },
    live: {
      lastScheduledDate: item.scheduledDate,
      lastPublishedDate: item.publishedDate,
      publisher: item.user,
      commitId: null,
      expiresOn: null
    }
  };
}

export function parseSandBoxItemToDetailedItem(item: SandboxItem): DetailedItem;
export function parseSandBoxItemToDetailedItem(item: SandboxItem[]): DetailedItem[];
export function parseSandBoxItemToDetailedItem(item: SandboxItem | SandboxItem[]): DetailedItem | DetailedItem[] {
  if (Array.isArray(item)) {
    // including level descriptors to avoid issues on pathNavigator;
    return item.map((i) => parseSandBoxItemToDetailedItem(i));
  }
  return {
    sandbox: {
      creator: item.creator,
      dateCreated: item.dateCreated,
      modifier: item.modifier,
      dateModified: item.dateModified,
      commitId: item.commitId,
      sizeInBytes: item.sizeInBytes,
      expiresOn: item.expiresOn
    },
    staging: null,
    live: null,
    ...(reversePluckProps(
      item,
      'creator',
      'dateCreated',
      'modifier',
      'dateModified',
      'commitId',
      'sizeInBytes'
    ) as BaseItem)
  };
}

const systemPropsList = [
  'orderDefault_f',
  'savedAsDraft',
  'content-type',
  'display-template',
  'no-template-required',
  'merge-strategy',
  'objectGroupId',
  'objectId',
  'file-name',
  'folder-name',
  'internal-name',
  'disabled',
  'createdDate',
  'createdDate_dt',
  'lastModifiedDate',
  'lastModifiedDate_dt'
];

export function parseContentXML(
  doc: Document,
  path: string = null,
  contentTypesLookup: LookupTable<ContentType>,
  instanceLookup: LookupTable<ContentInstance>
): ContentInstance {
  const id = nnou(doc) ? getInnerHtml(doc.querySelector(':scope > objectId')) : fileNameFromPath(path);
  const contentTypeId = nnou(doc) ? getInnerHtml(doc.querySelector(':scope > content-type')) : null;
  const current = {
    craftercms: {
      id,
      path,
      label: null,
      locale: null,
      dateCreated: null,
      dateModified: null,
      contentTypeId: contentTypeId,
      sourceMap: {}
    }
  };
  if (nnou(doc)) {
    current.craftercms.label = getInnerHtml(
      doc.querySelector(':scope > internal-name') ?? doc.querySelector(':scope > file-name')
    );
    current.craftercms.dateCreated = getInnerHtml(doc.querySelector(':scope > createdDate_dt'));
    current.craftercms.dateModified = getInnerHtml(doc.querySelector(':scope > lastModifiedDate_dt'));
  }
  instanceLookup[id] = current;
  if (nnou(doc)) {
    Array.from(doc.documentElement.children).forEach((element: Element) => {
      const tagName = element.tagName;
      if (!systemPropsList.includes(tagName)) {
        let sourceContentTypeId;
        const source = element.getAttribute('crafter-source');
        if (source) {
          current.craftercms.sourceMap[tagName] = source;
          sourceContentTypeId = element.getAttribute('crafter-source-content-type-id');
          if (!sourceContentTypeId) {
            console.error(
              `[parseContentXML] No "crafter-source-content-type-id" attribute found together with "crafter-source".`
            );
          }
        }
        const field = contentTypesLookup[sourceContentTypeId ?? contentTypeId].fields[tagName];
        if (!field) {
          console.error(
            `[parseContentXML] Field "${tagName}" was not found on "${sourceContentTypeId ??
              contentTypeId}" content type. "${source ?? path}" may have stale/outdated content properties.`
          );
        }
        current[tagName] = parseElementByContentType(element, field, contentTypesLookup, instanceLookup);
      }
    });
  }
  return current;
}

function parseElementByContentType(
  element: Element,
  field: ContentTypeField,
  contentTypesLookup: LookupTable<ContentType>,
  instanceLookup: LookupTable<ContentInstance>
) {
  if (!field) {
    return getInnerHtml(element) ?? '';
  }
  const type = field.type;
  // Some of this parsing (e.g. converting to booleans & numbers) is great but
  // the delivery side APIs don't have this intelligence. Could this cause any issues?
  // In any case, in the future we should go rather by a data-type instead of id of
  // the control as, various controls may produce same data type and the list
  // needn't be updated when new controls are added with a sound list of data types.
  switch (type) {
    case 'repeat': {
      const array = [];
      element.querySelectorAll(':scope > item').forEach((item) => {
        const repeatItem = {};
        item.querySelectorAll(':scope > *').forEach((fieldTag) => {
          let fieldTagName = fieldTag.tagName;
          repeatItem[fieldTagName] = parseElementByContentType(
            fieldTag,
            field.fields[fieldTagName],
            contentTypesLookup,
            instanceLookup
          );
        });
        array.push(repeatItem);
      });
      return array;
    }
    case 'node-selector': {
      const array = [];
      element.querySelectorAll(':scope > item').forEach((item) => {
        let path = getInnerHtml(item.querySelector(':scope > include'));
        const component = item.querySelector(':scope > component');
        if (!path && !component) {
          // TODO: Groovy Controller Issue;
          path = getInnerHtml(item.querySelector(':scope > key'));
        }
        const instance = parseContentXML(
          component ? wrapElementInAuxDocument(component) : null,
          path,
          contentTypesLookup,
          instanceLookup
        );
        array.push(instance);
      });
      return array;
    }
    case 'html':
      return unescapeHTML(getInnerHtml(element));
    case 'checkbox-group': {
      const deserialized = deserialize(element);
      const extract = deserialized[element.tagName].item;
      return Array.isArray(extract) ? extract : [extract];
    }
    case 'text':
    case 'image':
    case 'textarea':
    case 'dropdown':
    case 'date-time':
      return getInnerHtml(element);
    case 'boolean':
    case 'page-nav-order':
      return getInnerHtml(element) === 'true';
    case 'numeric-input':
      return getInnerHtmlNumber(element, parseFloat);
    default:
      console.log(
        `[parseElementByContentType] Missing type "${type}" on switch statement for field "${field.id}".`,
        element
      );
      return getInnerHtml(element);
  }
}

// Code disabled temporarily
// noinspection DuplicatedCode
/* function parseContentXMLWithoutContentTypes(
  doc: XMLDocument,
  path: string = null,
  instanceLookup: LookupTable<ContentInstance> = {}
): LookupTable<ContentInstance> {
  const id = nnou(doc)
    ? getInnerHtml(doc.querySelector(':scope > objectId'))
    : fileNameFromPath(path);
  const contentType = nnou(doc) ? getInnerHtml(doc.querySelector(':scope > content-type')) : null;
  instanceLookup[id] = {
    craftercms: {
      id,
      path,
      label: nnou(doc) ? getInnerHtml(doc.querySelector(':scope > internal-name')) : null,
      locale: null,
      dateCreated: nnou(doc) ? getInnerHtml(doc.querySelector(':scope > createdDate_dt')) : null,
      dateModified: nnou(doc)
        ? getInnerHtml(doc.querySelector(':scope > lastModifiedDate_dt'))
        : null,
      contentTypeId: contentType
    }
  };
  if (nnou(doc)) {
    parseContentXMLWithoutContentTypes_processFields(
      doc.documentElement,
      instanceLookup[id],
      instanceLookup
    );
  }
  return instanceLookup;
}

function parseContentXMLWithoutContentTypes_processFields(
  element: Element,
  instance: LookupTable<any>,
  instanceLookup: LookupTable<ContentInstance>
): void {
  Array.from(element.children).forEach((elem: Element) => {
    const fieldId = elem.tagName;
    if (!systemPropsList.includes(fieldId)) {
      if (fieldId.endsWith('_o')) {
        const parentId = getInnerHtml(element.querySelector('objectId'));
        const isNodeSelector =
          Boolean(elem.querySelector(':scope > item > component')) ||
          Boolean(
            elem.querySelector(':scope > item > key') &&
              elem.querySelector(':scope > item > value') &&
              elem.querySelector(':scope > item > include')
          );
        if (isNodeSelector) {
          // component
          instanceLookup[parentId][fieldId] = Array.from(
            elem.querySelectorAll(':scope > item')
          ).map((item) => {
            const component = item.querySelector(':scope > component');
            const isEmbedded = Boolean(component);
            return {
              craftercms: {
                id: isEmbedded ? getInnerHtml(component.querySelector(':scope > objectId')) : null,
                path: isEmbedded ? null : getInnerHtml(item.querySelector(':scope > include')),
                dateCreated: isEmbedded
                  ? getInnerHtml(component.querySelector(':scope > createdDate_dt'))
                  : null,
                dateModified: isEmbedded
                  ? getInnerHtml(component.querySelector(':scope > lastModifiedDate_dt'))
                  : null,
                contentTypeId: isEmbedded
                  ? getInnerHtml(component.querySelector(':scope > content-type'))
                  : null,
                label: isEmbedded
                  ? getInnerHtml(component.querySelector(':scope > internal-name'))
                  : getInnerHtml(item.querySelector(':scope > value')),
                locale: null
              }
            };
          });
        } else {
          // repeat group
          instanceLookup[parentId][fieldId] = Array.from(
            elem.querySelectorAll(':scope > item')
          ).map((item) => {
            const groupItem = {};
            parseContentXMLWithoutContentTypes_processFields(item, groupItem, instanceLookup);
            return groupItem;
          });
        }
      } else {
        instance[fieldId] = getInnerHtml(elem);
      }
    }
  });
} */

export function createChildModelIdList(model: ContentInstance, contentTypes: LookupTable<ContentType>): string[] {
  const children = [];
  const processFields = (model: ContentInstance, fields: ContentTypeField[], children: string[]) =>
    fields.forEach((field) => {
      // Check the field in the model isn't null in case the field isn't required and isn't present on current model.
      if (model[field.id]) {
        if (field.type === 'node-selector') {
          model[field.id].forEach((mdl: ContentInstance) => children.push(mdl.craftercms.id));
        } else if (field.type === 'repeat') {
          model[field.id].forEach((mdl: ContentInstance) => {
            processFields(mdl, Object.values(field.fields), children);
          });
        }
      }
    });
  if (contentTypes[model.craftercms.contentTypeId]) {
    processFields(model, Object.values(contentTypes[model.craftercms.contentTypeId].fields), children);
  }
  return children;
}

export function createChildModelLookup(
  models: LookupTable<ContentInstance>,
  contentTypes: LookupTable<ContentType>
): LookupTable<string[]> {
  const lookup = {};
  Object.values(models).forEach((model) => {
    lookup[model.craftercms.id] = createChildModelIdList(model, contentTypes);
  });
  return lookup;
}

export function normalizeModelsLookup(models: LookupTable<ContentInstance>) {
  const lookup = {};
  Object.entries(models).forEach(([id, model]) => {
    lookup[id] = normalizeModel(model);
  });
  return lookup;
}

export function normalizeModel(model: ContentInstance): ContentInstance {
  const normalized = { ...model };
  Object.entries(model).forEach(([prop, value]) => {
    if (prop.endsWith('_o')) {
      const collection: ContentInstance[] = value;
      if (Array.isArray(collection) && collection.length) {
        const isNodeSelector = Boolean(collection[0]?.craftercms?.id);
        if (isNodeSelector) {
          normalized[prop] = collection.map((item) => item.craftercms.id);
        } else {
          normalized[prop] = collection.map((item) => normalizeModel(item));
        }
      }
    }
  });
  return normalized;
}

export function denormalizeModel(
  normalized: ContentInstance,
  modelLookup: LookupTable<ContentInstance>
): ContentInstance {
  const model = { ...normalized };
  Object.entries(model).forEach(([prop, value]) => {
    if (prop.endsWith('_o')) {
      const collection: any[] = value;
      if (collection.length) {
        const isNodeSelector = typeof collection[0] === 'string';
        if (isNodeSelector) {
          model[prop] = collection.map((item) => denormalizeModel(modelLookup[item], modelLookup));
        } else {
          model[prop] = collection.map((item) => denormalizeModel(item, modelLookup));
        }
      }
    }
  });
  return model;
}

export function getNumOfMenuOptionsForItem(item: DetailedItem): number {
  if (isNavigable(item)) {
    return isRootPath(item.path) ? 11 : 16;
  } else if (isFolder(item)) {
    return isRootPath(item.path)
      ? item.path.startsWith('/templates') || item.path.startsWith('/scripts')
        ? 4
        : 3
      : item.path.startsWith('/templates') || item.path.startsWith('/scripts')
      ? 7
      : 6;
  } else if (isPreviewable(item)) {
    return item.systemType === 'component' || item.systemType === 'taxonomy' ? 11 : 10;
  }
}

// region State checker functions
export const isNewState = (value: number) => Boolean(value & STATE_NEW_MASK);
export const isModifiedState = (value: number) => Boolean(value & STATE_MODIFIED_MASK);
export const isDeletedState = (value: number) => Boolean(value & STATE_DELETED_MASK);
export const isLockedState = (value: number) => Boolean(value & STATE_LOCKED_MASK);
export const isSystemProcessingState = (value: number) => Boolean(value & STATE_SYSTEM_PROCESSING_MASK);
export const isSubmittedState = (value: number) => Boolean(value & STATE_SUBMITTED_MASK);
export const isScheduledState = (value: number) => Boolean(value & STATE_SCHEDULED_MASK);
export const isPublishingState = (value: number) => Boolean(value & STATE_PUBLISHING_MASK);
export const isSubmittedToStaging = (value: number) =>
  (isSubmittedState(value) || isScheduledState(value) || isPublishingState(value)) &&
  !Boolean(value & PUBLISHING_DESTINATION_MASK);
export const isSubmittedToLive = (value: number) =>
  (isSubmittedState(value) || isScheduledState(value) || isPublishingState(value)) &&
  Boolean(value & PUBLISHING_DESTINATION_MASK);
export const isStaged = (value: number) => Boolean(value & PUBLISHING_STAGED_MASK);
export const isLive = (value: number) => Boolean(value & PUBLISHING_LIVE_MASK);
export const isTranslationUpToDateState = (value: number) => Boolean(value & STATE_TRANSLATION_UP_TO_DATE_MASK);
export const isTranslationPendingState = (value: number) => Boolean(value & STATE_TRANSLATION_PENDING_MASK);
export const isTranslationInProgressState = (value: number) => Boolean(value & STATE_TRANSLATION_IN_PROGRESS_MASK);
// endregion

export const createItemStateMap: (status: number) => ItemStateMap = (status: number) => ({
  new: isNewState(status),
  modified: isModifiedState(status),
  deleted: isDeletedState(status),
  locked: isLockedState(status),
  systemProcessing: isSystemProcessingState(status),
  submitted: isSubmittedState(status),
  scheduled: isScheduledState(status),
  publishing: isPublishingState(status),
  submittedToStaging: isSubmittedToStaging(status),
  submittedToLive: isSubmittedToLive(status),
  staged: isStaged(status),
  live: isLive(status),
  translationUpToDate: isTranslationUpToDateState(status),
  translationPending: isTranslationPendingState(status),
  translationInProgress: isTranslationInProgressState(status)
});

// region Action presence checker functions
export const hasReadAction = (value: number) => Boolean(value & READ_MASK);
export const hasCopyAction = (value: number) => Boolean(value & CONTENT_COPY_MASK);
export const hasReadHistoryAction = (value: number) => Boolean(value & CONTENT_READ_VERSION_HISTORY_MASK);
export const hasGetDependenciesAction = (value: number) => Boolean(value & CONTENT_GET_DEPENDENCIES_ACTION_MASK);
export const hasPublishRequestAction = (value: number) => Boolean(value & PUBLISH_REQUEST_MASK);
export const hasCreateAction = (value: number) => Boolean(value & CONTENT_CREATE_MASK);
export const hasPasteAction = (value: number) => Boolean(value & CONTENT_PASTE_MASK);
export const hasEditAction = (value: number) => Boolean(value & CONTENT_EDIT_MASK);
export const hasRenameAction = (value: number) => Boolean(value & CONTENT_RENAME_MASK);
export const hasCutAction = (value: number) => Boolean(value & CONTENT_CUT_MASK);
export const hasUploadAction = (value: number) => Boolean(value & CONTENT_UPLOAD_MASK);
export const hasDuplicateAction = (value: number) => Boolean(value & CONTENT_DUPLICATE_MASK);
export const hasChangeTypeAction = (value: number) => Boolean(value & CONTENT_CHANGE_TYPE_MASK);
export const hasRevertAction = (value: number) => Boolean(value & CONTENT_REVERT_MASK);
export const hasEditControllerAction = (value: number) => Boolean(value & CONTENT_EDIT_CONTROLLER_MASK);
export const hasEditTemplateAction = (value: number) => Boolean(value & CONTENT_EDIT_TEMPLATE_MASK);
export const hasCreateFolderAction = (value: number) => Boolean(value & FOLDER_CREATE_MASK);
export const hasContentDeleteAction = (value: number) => Boolean(value & CONTENT_DELETE_MASK);
export const hasDeleteControllerAction = (value: number) => Boolean(value & CONTENT_DELETE_CONTROLLER_MASK);
export const hasDeleteTemplateAction = (value: number) => Boolean(value & CONTENT_DELETE_TEMPLATE_MASK);
export const hasPublishAction = (value: number) => Boolean(value & PUBLISH_MASK);
export const hasApprovePublishAction = (value: number) => Boolean(value & PUBLISH_APPROVE_MASK);
export const hasSchedulePublishAction = (value: number) => Boolean(value & PUBLISH_SCHEDULE_MASK);
export const hasPublishRejectAction = (value: number) => Boolean(value & PUBLISH_REJECT_MASK);
export const hasUnlockAction = (value: number) => Boolean(value & CONTENT_ITEM_UNLOCK);
// endregion

export const createItemActionMap: (availableActions: number) => ItemActionsMap = (value: number) => ({
  view: hasReadAction(value),
  copy: hasCopyAction(value),
  history: hasReadHistoryAction(value),
  dependencies: hasGetDependenciesAction(value),
  requestPublish: hasPublishRequestAction(value),
  createContent: hasCreateAction(value),
  paste: hasPasteAction(value),
  edit: hasEditAction(value),
  unlock: hasUnlockAction(value),
  rename: hasRenameAction(value),
  cut: hasCutAction(value),
  upload: hasUploadAction(value),
  duplicate: hasDuplicateAction(value),
  changeContentType: hasChangeTypeAction(value),
  revert: hasRevertAction(value),
  editController: hasEditControllerAction(value),
  editTemplate: hasEditTemplateAction(value),
  createFolder: hasCreateFolderAction(value),
  delete: hasContentDeleteAction(value),
  deleteController: hasDeleteControllerAction(value),
  deleteTemplate: hasDeleteTemplateAction(value),
  publish: hasPublishAction(value),
  approvePublish: hasApprovePublishAction(value),
  schedulePublish: hasSchedulePublishAction(value),
  rejectPublish: hasPublishRejectAction(value)
});

export function lookupItemByPath<T = DetailedItem>(path: string, lookupTable: LookupTable<T>): T {
  return lookupTable[withoutIndex(path)] ?? lookupTable[withIndex(path)];
}
