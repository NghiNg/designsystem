import React, {
    createRef,
    useLayoutEffect,
    useReducer,
    useRef,
    useState,
    useEffect,
} from 'react';
import {
    arrayOf,
    bool,
    func,
    number,
    object,
    oneOf,
    oneOfType,
    shape,
    string,
} from 'prop-types';
import classNames from 'classnames';
import { ChevronIkon, KryssIkon } from '@sb1/ffe-icons-react';

import HighCapacityResults from './HighCapacityResults';
import ListItemBody from './ListItemBody';
import {
    getButtonLabelClear,
    getButtonLabelClose,
    getButtonLabelOpen,
    locales,
} from './translations';
import { v4 as uuid } from 'uuid';
import { createReducer, stateChangeTypes } from './reducer';
import { getListToRender } from './getListToRender';
import { scrollIntoView } from './scrollIntoView';
import {
    getNewHighlightedIndexUp,
    getNewHighlightedIndexDown,
} from './getNewHighlightedIndex';
import { useSetAllyMessageItemSelection } from './a11y';
import Results from './Results';

const ARROW_UP = 'ArrowUp';
const ARROW_DOWN = 'ArrowDown';
const ESCAPE = 'Escape';
const ENTER = 'Enter';

const SearchableDropdown = ({
    id,
    labelId,
    className,
    dropdownList,
    dropdownAttributes,
    searchAttributes,
    maxRenderedDropdownElements = Number.MAX_SAFE_INTEGER,
    onChange = Function.prototype,
    inputProps = {},
    listElementBody: CustomListItemBody,
    noMatch = {},
    dark,
    locale,
    ariaInvalid,
    formatter = value => value,
    searchMatcher,
    selectedItem,
    highCapacity = false,
}) => {
    const [state, dispatch] = useReducer(
        createReducer({
            dropdownList,
            searchAttributes,
            maxRenderedDropdownElements,
            noMatchDropdownList: noMatch.dropdownList,
            searchMatcher,
            onChange,
        }),
        {
            isExpanded: false,
            prevResultCount: 0,
            prevSelectedItem: selectedItem,
            selectedItem,
            highlightedIndex: -1,
            inputValue: selectedItem ? selectedItem[dropdownAttributes[0]] : '',
        },
        initialState => {
            return {
                ...initialState,
                ...getListToRender({
                    inputValue: initialState.inputValue,
                    searchAttributes,
                    maxRenderedDropdownElements,
                    dropdownList,
                    searchMatcher,
                    showAllItemsInDropdown: !!selectedItem,
                }),
            };
        },
    );
    const isInitialMountRef = useRef(true);
    const [refs, setRefs] = useState([]);
    const inputRef = useRef();
    const openButtonRef = useRef();
    const clearButtonRef = useRef();
    const containerRef = useRef();

    const ListItemBodyElement = CustomListItemBody || ListItemBody;
    const listBoxRef = useRef(uuid());
    const noMatchMessageId = useRef(uuid());
    const shouldFocusOpenButton = useRef(false);
    const shouldFocusClearButton = useRef(false);
    const shouldFocusInput = useRef(false);

    const handleInputClick = () => {
        dispatch({ type: stateChangeTypes.InputClick });
    };

    const handleInputBlur = e => {
        if (inputProps.onBlur) {
            inputProps.onBlur(e);
        }
    };

    useEffect(() => {
        dispatch({
            type: stateChangeTypes.ItemSelectedProgrammatically,
            payload: { selectedItem },
        });
    }, [selectedItem, dispatch]);

    useSetAllyMessageItemSelection({
        searchAttributes,
        selectedItem: state.selectedItem,
        prevSelectedItem: state.prevSelectedItem,
        isInitialMount: isInitialMountRef.current,
        isExpanded: state.isExpanded,
        resultCount: state.listToRender.length,
        prevResultCount: state.prevResultCount,
    });

    useLayoutEffect(() => {
        setRefs(prevRefs =>
            Array(state.listToRender.length)
                .fill(null)
                .map((_, i) => prevRefs[i] || createRef()),
        );
    }, [state.listToRender.length]);

    useLayoutEffect(() => {
        if (shouldFocusOpenButton.current) {
            openButtonRef.current.focus();
            shouldFocusOpenButton.current = false;
        } else if (shouldFocusInput.current) {
            inputRef.current.focus();
            shouldFocusInput.current = false;
        } else if (shouldFocusClearButton.current) {
            clearButtonRef.current.focus();
            shouldFocusClearButton.current = false;
        }
    });

    useEffect(() => {
        isInitialMountRef.current = false;
    }, []);

    /**
     * Because of changes in event handling between react v16 and v17, the check for the
     * event flag will only work in react v17. Therefore, we also check Element.contains()
     * to keep react v16 compatibility.
     */
    const handleContainerFocus = e => {
        const isFocusInside =
            containerRef.current.contains(e.target) ||
            e.__isEventFromFFESearchableDropdown;

        if (!isFocusInside) {
            dispatch({
                type: stateChangeTypes.FocusMovedOutSide,
            });
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleContainerFocus);
        document.addEventListener('focusin', handleContainerFocus);
        return () => {
            document.removeEventListener('mousedown', handleContainerFocus);
            document.removeEventListener('focusin', handleContainerFocus);
        };
    }, []);

    const focusOpenButton = () => {
        shouldFocusOpenButton.current = true;
    };

    const focusClearButton = () => {
        shouldFocusClearButton.current = true;
    };

    /**
     * Adds a flag on the event so that handleContainerFocus()
     * can determine whether or not this event originated from this
     * component
     */
    function addFlagOnEventHandler(event) {
        // eslint-disable-next-line no-param-reassign
        event.nativeEvent.__isEventFromFFESearchableDropdown = true;
    }

    const handleKeyDown = event => {
        if (event.key === ENTER && state.highlightedIndex >= 0) {
            event.preventDefault();
            dispatch({
                type: stateChangeTypes.InputKeyDownEnter,
                payload: {
                    selectedItem: state.listToRender[state.highlightedIndex],
                },
            });
            onChange(state.listToRender[state.highlightedIndex]);
            focusClearButton();
            return;
        } else if (event.key === ESCAPE) {
            dispatch({ type: stateChangeTypes.InputKeyDownEscape });
            return;
        }

        if (event.key === ARROW_UP) {
            event.preventDefault();
            if (state.listToRender.length) {
                const newHighlightedIndex = getNewHighlightedIndexUp(
                    state.highlightedIndex,
                    state.listToRender.length,
                );
                dispatch({
                    type: stateChangeTypes.InputKeyDownArrowUp,
                    payload: { highlightedIndex: newHighlightedIndex },
                });
                scrollIntoView(
                    refs[newHighlightedIndex].current,
                    listBoxRef.current,
                );
            }
            return;
        }
        if (event.key === ARROW_DOWN) {
            event.preventDefault();
            if (state.listToRender.length) {
                const newHighlightedIndex = getNewHighlightedIndexDown(
                    state.highlightedIndex,
                    state.listToRender.length,
                );
                dispatch({
                    type: stateChangeTypes.InputKeyDownArrowDown,
                    payload: { highlightedIndex: newHighlightedIndex },
                });
                scrollIntoView(
                    refs[newHighlightedIndex].current,
                    listBoxRef.current,
                );
            }
            return;
        }
    };

    const ResultsElement = highCapacity ? HighCapacityResults : Results;

    return (
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
            onKeyDown={handleKeyDown}
            className={classNames(className, 'ffe-searchable-dropdown', {
                'ffe-searchable-dropdown--dark': dark,
            })}
            ref={containerRef}
            onMouseDown={addFlagOnEventHandler}
            onFocus={addFlagOnEventHandler}
        >
            <div>
                <input
                    {...inputProps}
                    ref={inputRef}
                    id={id}
                    aria-labelledby={labelId}
                    className={classNames('ffe-input-field', {
                        'ffe-input-field--dark': dark,
                    })}
                    onClick={handleInputClick}
                    onChange={e => {
                        if (inputProps.onChange) {
                            inputProps.onChange(e);
                        }
                        dispatch({
                            type: stateChangeTypes.InputChange,
                            payload: { inputValue: e.target.value },
                        });
                    }}
                    onBlur={handleInputBlur}
                    aria-describedby={
                        [
                            inputProps['aria-describedby'],
                            state.noMatch && noMatchMessageId.current,
                        ]
                            .filter(Boolean)
                            .join(' ') || null
                    }
                    value={formatter(state.inputValue)}
                    type="text"
                    role="combobox"
                    autoComplete="off"
                    aria-controls={listBoxRef.current}
                    aria-expanded={
                        state.isExpanded && !!state.listToRender.length
                    }
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-activedescendant={
                        state.highlightedIndex >= 0
                            ? refs[
                                  state.highlightedIndex
                              ]?.current?.getAttribute('id')
                            : null
                    }
                    aria-invalid={
                        typeof ariaInvalid === 'string'
                            ? ariaInvalid
                            : String(!!ariaInvalid)
                    }
                />
                <button
                    type="button"
                    ref={clearButtonRef}
                    aria-label={getButtonLabelClear(locale)}
                    className={classNames(
                        'ffe-searchable-dropdown__button ffe-searchable-dropdown__button--cross',
                        {
                            'ffe-searchable-dropdown__button--hidden': !state.selectedItem,
                        },
                    )}
                    onClick={() => {
                        dispatch({ type: stateChangeTypes.ClearButtonPressed });
                        onChange(null);
                        focusOpenButton();
                    }}
                >
                    <KryssIkon />
                </button>
                <button
                    type="button"
                    ref={openButtonRef}
                    aria-label={
                        state.isExpanded
                            ? getButtonLabelClose(locale)
                            : getButtonLabelOpen(locale)
                    }
                    className={classNames(
                        'ffe-searchable-dropdown__button ffe-searchable-dropdown__button--arrow',
                        {
                            'ffe-searchable-dropdown__button--flip':
                                state.isExpanded,
                        },
                        {
                            'ffe-searchable-dropdown__button--hidden': !!state.selectedItem,
                        },
                    )}
                    onClick={() =>
                        dispatch({ type: stateChangeTypes.ToggleButtonPressed })
                    }
                >
                    <ChevronIkon />
                </button>
            </div>
            <div
                className={classNames('ffe-searchable-dropdown__list', {
                    'ffe-searchable-dropdown__list--open': state.isExpanded,
                })}
            >
                <div id={listBoxRef.current} role="listbox">
                    {state.isExpanded && (
                        <ResultsElement
                            listBoxRef={listBoxRef}
                            listToRender={state.listToRender}
                            ListItemBodyElement={ListItemBodyElement}
                            highlightedIndex={state.highlightedIndex}
                            dispatch={dispatch}
                            dropdownAttributes={dropdownAttributes}
                            locale={locale}
                            refs={refs}
                            onChange={onChange}
                            isNoMatch={state.noMatch}
                            noMatch={noMatch}
                            noMatchMessageId={noMatchMessageId.current}
                            focusClearButton={focusClearButton}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

SearchableDropdown.propTypes = {
    /** Id of drop down */
    id: string.isRequired,

    /** Id of label */
    labelId: string.isRequired,

    /** Extra class */
    className: string,

    /** List of objects to be displayed in dropdown */
    dropdownList: arrayOf(object).isRequired,

    /** The selected item to be displayed in the input field. If not specified, uses internal state to decide. */
    selectedItem: object,

    /** Array of attributes to be displayed in list */
    dropdownAttributes: arrayOf(string).isRequired,

    /** Array of attributes used when filtering search */
    searchAttributes: arrayOf(string).isRequired,

    /** Props used on input field */
    inputProps: shape({
        onFocus: func,
    }),

    /** Limits number of rendered dropdown elements */
    maxRenderedDropdownElements: number,

    /** Called when a value is selected */
    onChange: func,

    /** Dark variant */
    dark: bool,

    /** Custom element to use for each item in dropDownList */
    listElementBody: func,

    /** Message and a dropdownList to use when no match */
    noMatch: shape({
        text: string,
        dropdownList: arrayOf(object),
    }),

    /** Locale to use for translations */
    locale: oneOf(Object.values(locales)),

    /** aria-invalid attribute  */
    ariaInvalid: oneOfType([string, bool]),

    /** Function used to format the input field value */
    formatter: func,

    /**
     * Function used to decide if an item matches the input field value
     * (inputValue: string, searchAttributes: string[]) => (item) => boolean
     */
    searchMatcher: func,

    /**
     * For situations where SearchableDropdown might be populated with hundreds of accounts
     * uses react-window for performance optimization, default false
     */
    highCapacity: bool,
};

export default SearchableDropdown;
