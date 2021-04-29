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

import User from '../../models/User';
import { Site } from '../../models/Site';
import LookupTable from '../../models/LookupTable';
import useStyles from './styles';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import PasswordRoundedIcon from '@material-ui/icons/VpnKeyRounded';
import ConfirmDropdown from '../Controls/ConfirmDropdown';
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import CloseRoundedIcon from '@material-ui/icons/CloseRounded';
import Divider from '@material-ui/core/Divider';
import DialogBody from '../Dialogs/DialogBody';
import clsx from 'clsx';
import Switch from '@material-ui/core/Switch';
import Chip from '@material-ui/core/Chip';
import Input from '@material-ui/core/Input';
import SecondaryButton from '../SecondaryButton';
import PrimaryButton from '../PrimaryButton';
import Grid from '@material-ui/core/Grid';
import { Skeleton } from '@material-ui/lab';
import { rand } from '../PathNavigator/utils';
import ResetPasswordDialog from '../ResetPasswordDialog';
import * as React from 'react';
import InputLabel from '@material-ui/core/InputLabel';

export interface UserInfoDialogUIProps {
  user: User;
  editMode: boolean;
  inProgress: boolean;
  dirty: boolean;
  openResetPassword: boolean;
  sites: Site[];
  passwordRequirementsRegex: string;
  rolesBySite: LookupTable<string[]>;
  onInputChange(value: object): void;
  onEnableChange(value: object): void;
  onCancelForm(): void;
  onSave(): void;
  onClose(): void;
  onCloseResetPasswordDialog(): void;
  onDelete(username: string): void;
  onResetPassword(value: boolean): void;
}

const translations = defineMessages({
  externallyManaged: {
    id: 'userInfoDialog.externallyManaged',
    defaultMessage: 'Externally managed'
  },
  siteName: {
    id: 'userInfoDialog.siteName',
    defaultMessage: 'Site name'
  },
  roles: {
    id: 'words.roles',
    defaultMessage: 'Roles'
  },
  confirmHelperText: {
    id: 'userInfoDialog.helperText',
    defaultMessage: 'Delete "{username}" user?'
  },
  confirmOk: {
    id: 'words.yes',
    defaultMessage: 'Yes'
  },
  confirmCancel: {
    id: 'words.no',
    defaultMessage: 'No'
  }
});

export function UserInfoDialogUI(props: UserInfoDialogUIProps) {
  const classes = useStyles();
  const { formatMessage } = useIntl();
  const {
    user,
    editMode,
    inProgress,
    dirty,
    openResetPassword,
    sites,
    rolesBySite,
    passwordRequirementsRegex,
    onSave,
    onClose,
    onDelete,
    onCloseResetPasswordDialog,
    onInputChange,
    onEnableChange,
    onCancelForm,
    onResetPassword
  } = props;

  return (
    <>
      <header className={classes.header}>
        <Avatar className={classes.avatar}>
          {user.firstName.charAt(0)}
          {user.lastName?.charAt(0) ?? ''}
        </Avatar>
        <section className={classes.userInfo}>
          <Typography variant="h6" component="h2">
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="subtitle1">{user.username}</Typography>
        </section>
        <section className={classes.actions}>
          {
            <Tooltip title={<FormattedMessage id="userInfoDialog.resetPassword" defaultMessage="Reset password" />}>
              <IconButton onClick={() => onResetPassword(true)}>
                <PasswordRoundedIcon />
              </IconButton>
            </Tooltip>
          }
          <ConfirmDropdown
            cancelText={formatMessage(translations.confirmCancel)}
            confirmText={formatMessage(translations.confirmOk)}
            confirmHelperText={formatMessage(translations.confirmHelperText, {
              username: user.username
            })}
            iconTooltip={<FormattedMessage id="userInfoDialog.deleteUser" defaultMessage="Delete user" />}
            icon={DeleteRoundedIcon}
            iconColor="action"
            onConfirm={() => {
              onDelete(user.username);
            }}
          />
          <Tooltip title={<FormattedMessage id="userInfoDialog.close" defaultMessage="Close" />}>
            <IconButton edge="end" onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </section>
      </header>
      <Divider />
      <DialogBody className={classes.body}>
        <section className={clsx(classes.section, 'noPaddingBottom')}>
          <Typography variant="subtitle1" className={classes.sectionTitle}>
            <FormattedMessage id="userInfoDialog.userDetails" defaultMessage="User Details" />
          </Typography>
          <form>
            <div className={classes.row}>
              <Typography variant="subtitle2" className={classes.label}>
                <FormattedMessage id="words.enabled" defaultMessage="Enabled" />
              </Typography>
              <div className={classes.switchWrapper}>
                <Switch
                  disabled={!editMode}
                  checked={user.enabled}
                  onChange={(e) => onEnableChange({ enabled: e.target.checked })}
                  color="primary"
                  name="enabled"
                  inputProps={{ 'aria-label': 'enabled checkbox' }}
                />
              </div>
            </div>
            <Divider />
            <div className={classes.row}>
              <Typography variant="subtitle2" className={classes.label}>
                <FormattedMessage id="words.username" defaultMessage="Username" />
              </Typography>
              <section className={classes.userNameWrapper}>
                <Typography variant="body2">{user.username}</Typography>
                {props.user?.externallyManaged && (
                  <Chip label={formatMessage(translations.externallyManaged)} size="small" className={classes.chip} />
                )}
              </section>
            </div>
            <div className={classes.row}>
              <InputLabel htmlFor="firstName" className={classes.label}>
                <Typography variant="subtitle2">
                  <FormattedMessage id="words.firstName" defaultMessage="First name" />
                </Typography>
              </InputLabel>
              <Input
                id="firstName"
                onChange={(e) => onInputChange({ firstName: e.currentTarget.value })}
                value={user.firstName}
                fullWidth
                readOnly={!editMode}
                classes={{ ...(!editMode && { root: classes.inputRoot, input: classes.readOnlyInput }) }}
              />
            </div>
            <div className={classes.row}>
              <InputLabel htmlFor="lastName" className={classes.label}>
                <Typography variant="subtitle2">
                  <FormattedMessage id="words.lastName" defaultMessage="Last name" />
                </Typography>
              </InputLabel>
              <Input
                id="lastName"
                onChange={(e) => onInputChange({ lastName: e.currentTarget.value })}
                value={user.lastName}
                fullWidth
                readOnly={!editMode}
                classes={{ ...(!editMode && { root: classes.inputRoot, input: classes.readOnlyInput }) }}
              />
            </div>
            <div className={classes.row}>
              <InputLabel htmlFor="email" className={classes.label}>
                <Typography variant="subtitle2">
                  <FormattedMessage id="words.lastName" defaultMessage="Email" />
                </Typography>
              </InputLabel>
              <Input
                id="email"
                onChange={(e) => onInputChange({ email: e.currentTarget.value })}
                value={user.email}
                fullWidth
                readOnly={!editMode}
                classes={{ ...(!editMode && { root: classes.inputRoot, input: classes.readOnlyInput }) }}
              />
            </div>
            {editMode && (
              <div className={classes.formActions}>
                <SecondaryButton disabled={!dirty || inProgress} onClick={onCancelForm}>
                  <FormattedMessage id="words.cancel" defaultMessage="Cancel" />
                </SecondaryButton>
                <PrimaryButton disabled={!dirty || inProgress} onClick={onSave} loading={inProgress}>
                  <FormattedMessage id="words.save" defaultMessage="Save" />
                </PrimaryButton>
              </div>
            )}
          </form>
        </section>
        <Divider />
        <section className={classes.section}>
          <Typography variant="subtitle1" className={classes.sectionTitle}>
            <FormattedMessage id="userInfoDialog.siteMemberships" defaultMessage="Site Memberships" />
          </Typography>
          <Grid container spacing={3} className={classes.membershipsWrapper}>
            <Grid item xs={4}>
              <Typography variant="subtitle2" color="textSecondary">
                {formatMessage(translations.siteName)}
              </Typography>
              {sites.map((site) => (
                <Typography key={site.id} variant="body2" className={classes.siteItem}>
                  {site.name}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={8}>
              <Typography variant="subtitle2" color="textSecondary">
                {formatMessage(translations.roles)}
              </Typography>
              {sites.map((site, i) =>
                rolesBySite[site.id] ? (
                  rolesBySite[site.id].length ? (
                    <Typography key={site.id} variant="body2" className={classes.siteItem}>
                      {rolesBySite[site.id].join(', ')}
                    </Typography>
                  ) : (
                    <Typography key={site.id} variant="body2" color="textSecondary" className={classes.siteItem}>
                      (<FormattedMessage id="userInfoDialog.noRoles" defaultMessage="No roles" />)
                    </Typography>
                  )
                ) : (
                  <Skeleton key={i} variant="text" className={classes.siteItem} style={{ width: `${rand(50, 90)}%` }} />
                )
              )}
            </Grid>
          </Grid>
        </section>
      </DialogBody>
      <ResetPasswordDialog
        open={openResetPassword}
        passwordRequirementsRegex={passwordRequirementsRegex}
        user={user}
        onClose={onCloseResetPasswordDialog}
      />
    </>
  );
}
