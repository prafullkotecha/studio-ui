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

import { selectTool, usePreviewContext } from '../previewContext';
import { MessageDescriptor, useIntl } from 'react-intl';
import React, { FunctionComponent, PropsWithChildren, ElementType, ReactElement } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import ChevronLeftRounded from '@material-ui/icons/ChevronLeftRounded';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';

const useStyles = makeStyles((theme: Theme) => createStyles({
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start'
  }
}));

type ToolPanelProps = PropsWithChildren<{
  title: string | MessageDescriptor;
  BackIcon?: ElementType,
  onBack?: () => void
}>;

interface PanelHeaderProps {
  title: string;
  BackIcon?: ElementType,
  onBack: () => void
}

export const PanelHeader: FunctionComponent<PanelHeaderProps> = (props) => {
  const classes = useStyles({});
  const { title, BackIcon = ChevronLeftRounded, onBack } = props;
  return (
    <>
      <header className={classes.panelHeader}>
        <IconButton onClick={onBack}>
          <BackIcon/>
        </IconButton>
        <Typography component="h2">
          {title}
        </Typography>
      </header>
      <Divider/>
    </>
  );
};

export function ToolPanel(props: ToolPanelProps): ReactElement | null {
  const [, dispatch] = usePreviewContext();
  const { formatMessage } = useIntl();
  const {
    title,
    BackIcon,
    onBack = () => dispatch(selectTool())
  } = props;
  return (
    <>
      <PanelHeader
        title={typeof title === 'object' ? formatMessage(title) : title}
        BackIcon={BackIcon}
        onBack={onBack}
      />
      <section>
        {props.children}
      </section>
    </>
  );
}

export default ToolPanel;