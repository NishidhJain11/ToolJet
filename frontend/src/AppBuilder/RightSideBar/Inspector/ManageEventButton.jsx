import React, { useState } from 'react';
import './manageEventButton.scss';
import AddRectangle from '@/_ui/Icon/solidIcons/AddRectangle';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import { Spinner } from 'react-bootstrap';

const ManageEventButton = ({
  eventDisplayName = 'Upon events',
  actionName,
  index,
  removeHandler,
  actionsUpdatedLoader,
  eventsUpdatedLoader,
  eventsDeletedLoader,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div style={{ marginBottom: '4px' }}>
      <div
        className="manage-event-btn border-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {eventsDeletedLoader ? (
          <div className="d-flex justify-content-center p-2">
            {' '}
            <Spinner style={{ width: '16px', height: '16px', color: 'var(--indigo9)' }} />
          </div>
        ) : (
          <div data-cy="event-handler-card" className="d-flex">
            <span className="d-flex align-items-center px-2">
              <SortableList.DragHandle show />
            </span>
            <div
              className="d-flex justify-content-between"
              role="button"
              style={{ padding: '6px 12px 6px 8px', width: '100%' }}
            >
              <div className="text-truncate event-handler-text" data-cy="event-handler">
                {!eventsUpdatedLoader ? (
                  eventDisplayName
                ) : (
                  <Spinner style={{ width: '16px', height: '16px', color: 'var(--indigo9)' }} />
                )}
              </div>
              {!actionsUpdatedLoader ? (
                <div className="text-truncate event-name-text" data-cy="event-name">
                  <small className="event-action font-weight-light text-truncate">
                    {actionName ? actionName : 'Select action'}
                  </small>
                  {!actionName && <AddRectangle width={13.33} />}
                  <span>
                    <span>
                      {isHovered && (
                        <ButtonSolid
                          variant="tertiary"
                          size="xs"
                          className={'list-menu-option-btn'}
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <div
                            className="list-item-popover-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHandler(index);
                            }}
                          >
                            <div className="d-flex align-center">
                              <Trash fill={'#E54D2E'} width={12} />
                            </div>
                          </div>
                        </ButtonSolid>
                      )}
                    </span>
                  </span>
                </div>
              ) : (
                <Spinner style={{ width: '16px', height: '16px', color: 'var(--indigo9)' }} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEventButton;
