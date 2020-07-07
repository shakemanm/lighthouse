/**
 * @license Copyright 2019 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer.js');
const pageFunctions = require('../../lib/page-functions.js');

/* eslint-env browser, node */

/**
 *  @param {HTMLElement}
 *  @return {String|[nodePathString, bool]}
 */
/* istanbul ignore next */
function getParentForm(node) {
  if (node == undefined){
    return [undefined, false];
  }
  if (node.nodeName == 'BODY'){
    return [getNodePath(node), false];
  };
  if (node.nodeName == 'FORM'){
    if (node.id && node.id != ""){
      return [node.id, true];
    }
    if (node.name && node.name != ""){
      return [node.name, true];
    }
    // @ts-ignore - getNodePath put into scope via stringification
    return [getNodePath(node), false]; // eslint-disable-line no-undef
  };

  return getParentForm(node.parentElement);
}

/**
 * @return {LH.Artifacts['FormElements']}
 */
/* istanbul ignore next */
function collectFormElements() {
  // @ts-ignore - put into scope via stringification
  const inputElements = getElementsInDocument('input'); // eslint-disable-line no-undef
  const selectElements = getElementsInDocument('select'); // eslint-disable-line no-undef
  const textareaElements = getElementsInDocument('textarea'); // eslint-disable-line no-undef
  const labelElements = getElementsInDocument('label'); // eslint-disable-line no-undef
  const formElements = inputElements.concat(selectElements, textareaElements, labelElements)
  return formElements.map(/** @param {HTMLElement} node */ (node) => {
    return {
      id: node.id,
      elementType: node.nodeName,
      name: node.name,
      parentForm: getParentForm(node)[0],
      parentFormIdentified: getParentForm(node)[1],
      placeHolder: node.placeholder,
      autocomplete: node.autocomplete,
      for: node.for,
    };
  });
}

class FormElements extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<LH.Artifacts['FormElements']>}
   * @override
   */
  async afterPass(passContext) {
    const driver = passContext.driver;

    const expression = `(() => {
      ${getParentForm.toString()};
      ${pageFunctions.getOuterHTMLSnippetString};
      ${pageFunctions.getElementsInDocumentString};
      ${pageFunctions.isPositionFixedString};
      ${pageFunctions.getNodePathString};
      return (${collectFormElements})();

    })()`;

    /** @type {LH.Artifacts['FormElements']} */
    const formElements = await driver.evaluateAsync(expression, {useIsolation: true});
    return formElements;
  }
}

module.exports = FormElements;
