import React, { useContext, useEffect, useState } from 'react';
import { authenticationService, userService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Layout from '@/_ui/Layout';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { BreadCrumbContext } from '@/App/App';
import { decodeEntities } from '@/_helpers/utils';

function SettingsPage(props) {
  const currentSession = authenticationService.currentSessionValue;
  const email = currentSession?.current_user.email;
  const [fullName, setFullName] = React.useState(
    joinNames(currentSession?.current_user.first_name, currentSession?.current_user.last_name)
  );
  const [currentpassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [updateInProgress, setUpdateInProgress] = React.useState(false);
  const [passwordChangeInProgress, setPasswordChangeInProgress] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const focusRef = React.useRef(null);
  const { t } = useTranslation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const [helperText, setHelperText] = useState('');
  const [validPassword, setValidPassword] = useState(true);

  useEffect(() => {
    updateSidebarNAV('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function joinNames(firstName, lastName) {
    if (lastName && lastName.trim() !== '') {
      return `${firstName} ${lastName}`;
    } else {
      return firstName;
    }
  }

  const handleNameSplit = (fullName) => {
    const words = fullName.trim().split(' ');
    const firstName = words.length > 1 ? words.slice(0, -1).join(' ') : words[0];
    const lastName = words.length > 1 ? words[words.length - 1] : '';
    return [firstName, lastName];
  };

  const updateDetails = async () => {
    const fullNameMatch = fullName.match(/^ *$/);
    if (fullNameMatch !== null) {
      toast.error(`Name can't be empty!`, {
        position: 'top-center',
      });
      return;
    }

    setUpdateInProgress(true);
    try {
      const [firstName, lastName] = handleNameSplit(fullName);
      const updatedUser = await userService.updateCurrentUser(firstName, lastName);
      setFullName(joinNames(updatedUser?.first_name, updatedUser?.last_name));
      let avatar;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        avatar = await userService.updateAvatar(formData);
      }

      toast.success('Details updated!', {
        duration: 3000,
      });
      setUpdateInProgress(false);
      authenticationService.updateCurrentSession({
        ...authenticationService.currentSessionValue,
        current_user: {
          ...authenticationService.currentSessionValue.current_user,
          first_name: firstName,
          last_name: lastName,
          ...(avatar && { avatar_id: avatar.id }),
        },
        isUserUpdated: true,
      });
    } catch (error) {
      toast.error('Something went wrong');
      setUpdateInProgress(false);
    }
  };

  const handlePasswordInput = (input) => {
    setNewPassword(input);
    if (input.length > 100) {
      setHelperText('Password should be Max 100 characters');
      setValidPassword(false);
    } else if (input.length < 5 && input.length > 0) {
      setHelperText('Password should be at least 5 characters');
      setValidPassword(false);
    } else {
      setHelperText('');
      setValidPassword(true);
    }
  };

  const changePassword = async () => {
    const errorMsg =
      (currentpassword.match(/^ *$/) !== null && 'Current password') ||
      (newPassword.match(/^ *$/) !== null && 'New password') ||
      (confirmPassword.match(/^ *$/) !== null && 'Confirm new password');

    if (errorMsg) {
      toast.error(errorMsg + " can't be empty!", {
        duration: 3000,
      });
      return;
    }
    if (currentpassword === newPassword) {
      toast.error("New password can't be the same as the current one!", {
        duration: 3000,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm new password should be same', {
        duration: 3000,
      });
      return;
    }

    setPasswordChangeInProgress(true);
    try {
      await userService.changePassword(currentpassword, newPassword);
      toast.success('Password updated successfully', {
        duration: 3000,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Please verify that you have entered the correct password', {
        duration: 3000,
      });
    }
    setPasswordChangeInProgress(false);
  };

  const newPasswordKeyPressHandler = async (event) => {
    if (event.key === 'Enter') {
      await focusRef.current.focus();
    }
  };

  const confirmPasswordKeyPressHandler = async (event) => {
    if (event.key === 'Enter') {
      await changePassword();
    }
  };

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="wrapper">
        <div className="page-wrapper profile-page-content-wrap">
          <div style={{ height: `calc(100vh - 2.5rem - 64px)` }}>
            <div className="container-xl">
              <div className="profile-page-card">
                <div className="card-header">
                  <h3 className="card-title" data-cy="card-title-profile">
                    {t('header.profileSettingPage.profile', 'Profile')}
                  </h3>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col">
                      <div className="mb-3 tj-app-input">
                        <label className="form-label" data-cy="first-name-label">
                          Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="first-name"
                          placeholder={'Enter full name'}
                          value={decodeEntities(fullName)}
                          onChange={(event) => setFullName(event.target.value)}
                          autoComplete="off"
                          data-cy="name-input-field"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col">
                      <div className="mb-3 tj-app-input">
                        <label className="form-label" data-cy="email-label">
                          {t('header.profileSettingPage.email', 'Email address')}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="email"
                          value={email}
                          readOnly
                          disabled
                          data-cy="email-input"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="col">
                      <div className="mb-3 tj-app-input">
                        <label className="form-label" data-cy="avatar-label">
                          {t('header.profileSettingPage.avatar', 'Avatar')}
                        </label>
                        <input
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (Math.round(file.size / 1024) > 2048) {
                              toast.error('File size cannot exceed more than 2MB');
                              e.target.value = null;
                            } else {
                              setSelectedFile(file);
                            }
                          }}
                          accept="image/*"
                          type="file"
                          className="form-control"
                          data-cy="avatar-upload-field"
                        />
                      </div>
                    </div>
                  </div>
                  <ButtonSolid isLoading={updateInProgress} onClick={updateDetails} data-cy="update-button">
                    {t('header.profileSettingPage.update', 'Update')}
                  </ButtonSolid>
                  {/* An !important style on theme.scss is making the last child of every .card-body color to #c3c3c3!.  */}
                  {/* The div below is a placeholder to prevent it from affecting the button above.  */}
                  <div></div>
                </div>
              </div>
              <br />
              <div className="profile-page-card">
                <div className="card-header">
                  <h3 className="card-title" data-cy="card-title-change-password">
                    {t('header.profileSettingPage.changePassword', 'Change password')}
                  </h3>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col">
                      <div className="mb-3 tj-app-input">
                        <label className="form-label" data-cy="current-password-label">
                          {t('header.profileSettingPage.currentPassword', 'Current password')}
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="last-name"
                          placeholder={t('header.profileSettingPage.enterCurrentPassword', 'Enter current password')}
                          value={currentpassword}
                          onChange={(event) => setCurrentPassword(event.target.value)}
                          data-cy="current-password-input"
                        />
                      </div>
                    </div>
                    <div className="col">
                      <div className="mb-3 tj-app-input">
                        <label className="form-label" data-cy="new-password-label">
                          {t('header.profileSettingPage.newPassword', 'New password')}
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="last-name"
                          placeholder={t('header.profileSettingPage.enterNewPassword', 'Enter new password')}
                          value={newPassword}
                          onChange={(event) => handlePasswordInput(event.target.value)}
                          onKeyPress={newPasswordKeyPressHandler}
                          data-cy="new-password-input"
                        />
                        <small style={{ color: !validPassword ? 'red' : undefined }} data-cy="password-helper-text">
                          {helperText}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="w-50 confirm-input">
                    <div className="mb-3 tj-app-input">
                      <label className="form-label" data-cy="confirm-password-label">
                        {t('header.profileSettingPage.confirmNewPassword', 'Confirm new password')}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name="last-name"
                        placeholder={t('header.profileSettingPage.confirmNewPassword', 'Confirm new password')}
                        value={confirmPassword}
                        ref={focusRef}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        onKeyPress={confirmPasswordKeyPressHandler}
                        data-cy="confirm-password-input"
                      />
                    </div>
                  </div>
                  <ButtonSolid
                    isLoading={passwordChangeInProgress}
                    disabled={newPassword.length < 5 || confirmPassword.length < 5 || !validPassword}
                    onClick={changePassword}
                    data-cy="change-password-button"
                  >
                    {t('header.profileSettingPage.changePassword', 'Change password')}
                  </ButtonSolid>
                  {/* An !important style on theme.scss is making the last child of every .card-body color to #c3c3c3!.  */}
                  {/* The div below is a placeholder to prevent it from affecting the button above.  */}
                  <div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export { SettingsPage };
