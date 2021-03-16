/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
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

import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import clsx from 'clsx';
import Header from '../PathNavigator/PathNavigatorHeader';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import { StateStylingProps } from '../../models/UiConfig';
import PathNavigatorTreeItem from './PathNavigatorTreeItem';
import LookupTable from '../../models/LookupTable';
import { DetailedItem } from '../../models/Item';
import ArrowRightRoundedIcon from '@material-ui/icons/ArrowRightRounded';
import ArrowDropDownRoundedIcon from '@material-ui/icons/ArrowDropDownRounded';

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

interface PathNavigatorTreeUIProps {
  title: string;
  icon?: Partial<StateStylingProps>;
  container?: Partial<StateStylingProps>;
  data: TreeNode;
  itemsByPath: LookupTable<DetailedItem>;
  onIconClick(path: string): void;
  onLabelClick(event: React.MouseEvent<Element, MouseEvent>, path: string): void;
  onChangeCollapsed(collapsed: boolean): void;
  onOpenItemMenu(element: Element, path: string): void;
  onHeaderButtonClick(element: Element): void;
  isCollapsed: boolean;
  expandedNodes: string[];
  classes?: Partial<Record<'root' | 'body', string>>;
}

const useStyles = makeStyles(() =>
  createStyles({
    root: {},
    accordion: {
      boxShadow: 'none',
      backgroundColor: 'inherit',
      '&.Mui-expanded': {
        margin: 'inherit'
      }
    },
    accordionDetails: {
      padding: 0,
      flexDirection: 'column'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      padding: '2px',
      marginLeft: '5px',
      '& p': {
        marginLeft: '10px'
      }
    }
  })
);

export default function PathNavigatorTreeUI(props: PathNavigatorTreeUIProps) {
  const classes = useStyles();
  const {
    icon,
    container,
    title,
    data,
    itemsByPath,
    onIconClick,
    onLabelClick,
    onChangeCollapsed,
    onOpenItemMenu,
    onHeaderButtonClick,
    isCollapsed,
    expandedNodes
  } = props;

  return (
    <Accordion
      expanded={!isCollapsed}
      onChange={() => onChangeCollapsed(!isCollapsed)}
      className={clsx(
        classes.accordion,
        props.classes?.root,
        container?.baseClass,
        container ? (isCollapsed ? container.collapsedClass : container.expandedClass) : void 0
      )}
      style={{
        ...container?.baseStyle,
        ...(container ? (isCollapsed ? container.collapsedStyle : container.expandedStyle) : void 0)
      }}
    >
      <Header
        iconClassName={clsx(icon?.baseClass, icon ? (isCollapsed ? icon.collapsedClass : icon.expandedClass) : null)}
        iconStyle={{
          ...icon?.baseStyle,
          ...(icon ? (isCollapsed ? icon.collapsedStyle : icon.expandedStyle) : null)
        }}
        title={title}
        locale={null}
        onContextMenu={(element) => {
          onHeaderButtonClick(element);
        }}
      />
      <AccordionDetails className={clsx(classes.accordionDetails, props.classes?.body)}>
        <TreeView
          className={classes.root}
          expanded={expandedNodes}
          defaultExpandIcon={<ArrowRightRoundedIcon />}
          defaultCollapseIcon={<ArrowDropDownRoundedIcon />}
          disableSelection={true}
        >
          <PathNavigatorTreeItem
            node={data}
            itemsByPath={itemsByPath}
            onIconClick={onIconClick}
            onLabelClick={onLabelClick}
            onOpenItemMenu={onOpenItemMenu}
          />
        </TreeView>
      </AccordionDetails>
    </Accordion>
  );
}
