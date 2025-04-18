/* eslint no-undef: 0 */
/* eslint no-plusplus: 0 */
/* eslint object-curly-newline: 0 */
// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import {
  getQueryIndex,
} from '../../scripts/utilities.js';

const datePropertiesEnum = {
  RELEASE_DATE: 'releasedate',
};

/**
 * is a property expected to be a string or date
 * @param {*} propName string of the property name
 * @returns whether property value is expected to be date or string
 */
function getPropertyType(propName) {
  if (Object.values(datePropertiesEnum).includes(propName.toLowerCase())) {
    return 'date';
  }
  return 'string';
}

/**
 * Get the list of available properties from the index.
 * This is in the columns property at the parent level.
 * @returns array of property names
 */
export async function getProperties() {
  const indexUrl = '/tools/querybuilder/sample-index.json';
  const { columns: properties } = await getQueryIndex(indexUrl);
  return properties;
}

/**
 * Customize the query picker based on properties.
 * Operators are different for date properties from string properties.
 * @returns array of json objects containing the filter properties and their associated operations
 */
async function buildFilters() {
  const properties = await getProperties();
  const filters = [];
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const propType = getPropertyType(prop);
    const propFilter = {
      id: `${prop}`,
      label: `${prop}`,
      type: `${propType !== 'date' ? 'string' : propType}`,
    };
    if (propType === 'date') {
      propFilter.operators = ['before', 'after', 'equal'];
      propFilter.validation = { format: 'yyyy/mm/dd' };
      propFilter.plugin = 'datepicker';
      propFilter.plugin_config = {
        format: 'yyyy/mm/dd',
        todayBtn: 'linked',
        todayHighlight: true,
        autoclose: true,
      };
    } else {
      propFilter.operators = ['equal', 'not_equal', 'contains', 'not_contains', 'is_null', 'is_not_null', 'is_not_empty'];
    }
    filters.push(propFilter);
  }
  return filters;
}

/**
 * Build the query picker form for the Toolbar
 * @param {[obj]} searchFilters filter options used to populate the dropdowns
 */
export function addForm(searchFilters) {
  $('#builder-basic').queryBuilder({
    plugins: ['bt-tooltip-errors'],
    filters: searchFilters,
    operators: [
      { type: 'equal' },
      { type: 'not_equal' },
      { type: 'in' },
      { type: 'not_in' },
      { type: 'less' },
      { type: 'less_or_equal' },
      { type: 'greater' },
      { type: 'greater_or_equal' },
      { type: 'between' },
      { type: 'not_between' },
      { type: 'begins_with' },
      { type: 'not_begins_with' },
      { type: 'contains' },
      { type: 'not_contains' },
      { type: 'ends_with' },
      { type: 'not_ends_with' },
      { type: 'is_not_empty' },
      { type: 'is_null' },
      { type: 'is_not_null' },
      { type: 'before', nb_inputs: 1, multiple: false, apply_to: ['date'] },
      { type: 'after', nb_inputs: 1, apply_to: ['date'] },
    ],
  });
}

/**
 * Add functionality for Reset Rules and Get Rules buttons.
 * When Reset Rules is pressed, clear out all the current rules.
 * When Get Rules is pressed, make the query into a json object and return it
 * as a string where the cursor was in DA. Finally close the querypicker.
 * @param {*} actions
 */
function initControls(actions) {
  $('#btn-reset').on('click', (e) => {
    e.preventDefault();
    $('#builder-basic').queryBuilder('reset');
  });

  $('#btn-get').on('click', (e) => {
    e.preventDefault();
    const result = $('#builder-basic').queryBuilder('getRules');
    if (!$.isEmptyObject(result)) {
      actions.sendText(JSON.stringify(result, null, 2));
      actions.closeLibrary();
    }
  });
}

(async function init() {
  const { actions } = await DA_SDK;

  const searchFilters = await buildFilters();
  addForm(searchFilters);
  initControls(actions);
}());
