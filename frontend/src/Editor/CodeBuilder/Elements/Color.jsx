import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import classNames from 'classnames';
import { computeColor } from '@/_helpers/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Tooltip } from 'react-bootstrap';

export const Color = ({
  value,
  onChange,
  pickerStyle = {},
  cyLabel,
  asBoxShadowPopover = true,
  meta,
  outerWidth = '142px',
  component,
  styleDefinition,
  onReset,
}) => {
  value = component == 'Button' ? computeColor(styleDefinition, value, meta) : value;
  const [showPicker, setShowPicker] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const colorPickerPosition = meta?.colorPickerPosition ?? '';
  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };
  const outerStyles = {
    width: outerWidth,
    height: '32px',
    borderRadius: ' 6px',
    display: 'flex',
    paddingLeft: '4px',
    alignItems: 'center',
    gap: '4px',
    background: showPicker && 'var(--indigo2)',
    outline: showPicker && '1px solid var(--indigo9)',
    boxShadow: showPicker && '0px 0px 0px 1px #C6D4F9',
  };

  const decimalToHex = (alpha) => {
    let aHex = Math.round(255 * alpha).toString(16);
    return alpha === 0 ? '00' : aHex.length < 2 ? `0${aHex}` : aHex;
  };
  const handleColorChange = (color) => {
    const hexCode = `${color.hex}${decimalToHex(color?.rgb?.a ?? 1.0)}`;
    onChange(hexCode);
  };
  const eventPopover = () => {
    return (
      <Popover
        className={classNames(
          { 'dark-theme': darkMode },
          // This is fix when color picker don't have much space to open in bottom side
          { 'inspector-color-input-popover': colorPickerPosition === 'top' }
        )}
        style={{ zIndex: 10000 }}
      >
        <Popover.Body className={!asBoxShadowPopover && 'boxshadow-picker'} style={{ padding: '0px' }}>
          <>{ColorPicker()}</>
        </Popover.Body>
      </Popover>
    );
  };

  const ColorPicker = () => {
    return (
      <>
        {showPicker && (
          <div>
            <div style={coverStyles} onClick={() => setShowPicker(false)} />
            <div style={pickerStyle}>
              <SketchPicker
                onFocus={() => setShowPicker(true)}
                color={value}
                onChangeComplete={handleColorChange}
                style={{ bottom: 0 }}
              />
            </div>
          </div>
        )}
      </>
    );
  };
  const ColorPickerInputBox = () => {
    return (
      <div
        className="row mx-0 color-picker-input d-flex"
        onClick={() => setShowPicker(true)}
        data-cy={`${String(cyLabel)}-picker`}
        style={outerStyles}
      >
        <div
          className="col-auto"
          style={{
            float: 'right',
            width: '24px',
            height: '24px',
            borderRadius: ' 6px',
            border: `1px solid var(--slate7, #D7DBDF)`,
            boxShadow: `0px 1px 2px 0px rgba(16, 24, 40, 0.05)`,
            backgroundColor: value,
          }}
          data-cy={`${String(cyLabel)}-picker-icon`}
        ></div>

        <div className="col tj-text-xsm p-0 color-slate12" data-cy={`${String(cyLabel)}-value`}>
          {value}
        </div>
        {typeof onReset === 'function' && (
          <div className="col-auto p-0">
            <OverlayTrigger placement="left" overlay={<Tooltip id="reset-default-color">Reset to default</Tooltip>}>
              <div onClick={onReset} className="color-reset">
                <SolidIcon name="reset" />
              </div>
            </OverlayTrigger>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="row fx-container" data-cy="color-picker-parent">
      <div className="col">
        <div className="field">
          {!asBoxShadowPopover ? (
            <>
              {ColorPicker()}
              {ColorPickerInputBox()}
            </>
          ) : (
            <OverlayTrigger
              onToggle={(showPicker) => {
                setShowPicker(showPicker);
              }}
              show={showPicker}
              trigger="click"
              placement={!colorPickerPosition ? 'left' : colorPickerPosition}
              rootClose={true}
              overlay={eventPopover()}
            >
              {ColorPickerInputBox()}
            </OverlayTrigger>
          )}
        </div>
      </div>
    </div>
  );
};
