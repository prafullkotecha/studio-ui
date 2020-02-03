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

import { createReducer } from '@reduxjs/toolkit';
import { GlobalState } from '../../models/GlobalState';
import { CHANGE_SITE } from '../actions/sites';

const reducer = createReducer<GlobalState['sites']>({ byId: {}, active: null }, {
  [CHANGE_SITE]: (state, { payload }) => (
    payload.nextSite === state.active
      ? state
      : ({
        ...state,
        active: payload.nextSite
      })
  )
});

export default reducer;