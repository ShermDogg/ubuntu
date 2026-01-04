import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useState, useEffect } from 'react';

// GraphQL Queries
const GET_MY_PROFILE = gql`
  query GetMyProfile {
    me {
      id
      firstName
      lastName
      email
      bio
      avatar
      website
      twitter
      instagram
      facebook
      role
      createdAt
      gravatarUrl
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateUserInput!) {
    updateProfile(input: $input) {
      success
      message
      user {
        id
        firstName
        lastName
        email
        bio
        avatar
        website
        twitter
        instagram
        facebook
      }
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

const UPDATE_AVATAR = gql`
  mutation UpdateAvatar($avatarUrl: String) {
    updateAvatar(avatarUrl: $avatarUrl) {
      success
      message
      user {
        id
        avatar
        gravatarUrl
      }
    }
  }
`;

const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password) {
      success
      message
    }
  }
`;

function Profile({ onBack }) {
  const { loading, error, data, refetch } = useQuery(GET_MY_PROFILE);
  
  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      alert(data.updateProfile.message);
      refetch();
    },
    onError: (error) => {
      alert(`Update failed: ${error.message}`);
    }
  });

  const [changePassword] = useMutation(CHANGE_PASSWORD, {
    onCompleted: (data) => {
      alert(data.changePassword.message);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error) => {
      alert(`Password change failed: ${error.message}`);
    }
  });

  const [updateAvatar] = useMutation(UPDATE_AVATAR, {
    onCompleted: (data) => {
      alert(data.updateAvatar.message);
      refetch();
    }
  });

  const [deleteAccount] = useMutation(DELETE_ACCOUNT, {
    onCompleted: (data) => {
      alert(data.deleteAccount.message);
      localStorage.removeItem('token');
      window.location.href = '/';
    },
    onError: (error) => {
      alert(`Account deletion failed: ${error.message}`);
    }
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    website: '',
    twitter: '',
    instagram: '',
    facebook: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [avatarUrl, setAvatarUrl] = useState('');

  // Load user data when component mounts
  useEffect(() => {
    if (data?.me) {
      setProfileData({
        firstName: data.me.firstName || '',
        lastName: data.me.lastName || '',
        email: data.me.email || '',
        bio: data.me.bio || '',
        website: data.me.website || '',
        twitter: data.me.twitter || '',
        instagram: data.me.instagram || '',
        facebook: data.me.facebook || ''
      });
    }
  }, [data]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty strings
    const input = Object.keys(profileData).reduce((acc, key) => {
      if (profileData[key] !== '') {
        acc[key] = profileData[key];
      }
      return acc;
    }, {});

    updateProfile({
      variables: { input }
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    changePassword({
      variables: {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }
    });
  };

  const handleAvatarSubmit = (e) => {
    e.preventDefault();
    
    if (avatarUrl) {
      updateAvatar({
        variables: { avatarUrl }
      });
    }
  };

  const handleResetAvatar = () => {
    updateAvatar({
      variables: { avatarUrl: null }
    });
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    
    if (deleteData.password !== deleteData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteAccount({
        variables: { password: deleteData.password }
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3">Loading profile...</p>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger">
      <h4>Error Loading Profile</h4>
      <p>{error.message}</p>
      <button className="btn btn-primary" onClick={() => refetch()}>
        Try Again
      </button>
    </div>
  );

  const user = data.me;

  return (
    <div className="container py-5">
      <button 
        className="btn btn-outline-secondary mb-4" 
        onClick={onBack}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back to Articles
      </button>

      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <img 
                src={user.avatar || user.gravatarUrl} 
                alt={user.firstName}
                className="rounded-circle mb-3"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <h4 className="fw-bold">{user.firstName} {user.lastName}</h4>
              <p className="text-muted">{user.email}</p>
              <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              <p className="text-muted mt-3 small">
                <i className="bi bi-calendar me-1"></i>
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="list-group mt-3">
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="bi bi-person me-2"></i>
              Profile Settings
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <i className="bi bi-key me-2"></i>
              Change Password
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'avatar' ? 'active' : ''}`}
              onClick={() => setActiveTab('avatar')}
            >
              <i className="bi bi-image me-2"></i>
              Avatar Settings
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'social' ? 'active' : ''}`}
              onClick={() => setActiveTab('social')}
            >
              <i className="bi bi-link-45deg me-2"></i>
              Social Links
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'danger' ? 'active' : ''} text-danger`}
              onClick={() => setActiveTab('danger')}
            >
              <i className="bi bi-exclamation-triangle me-2"></i>
              Danger Zone
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-9">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-person me-2"></i>
                  Profile Settings
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      required
                    />
                    <div className="form-text">
                      Changing your email will update your Gravatar
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary">
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Change Password */}
          {activeTab === 'password' && (
            <div className="card shadow-sm">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <i className="bi bi-key me-2"></i>
                  Change Password
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      required
                      minLength="6"
                    />
                    <div className="form-text">
                      Password must be at least 6 characters
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-warning">
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Avatar Settings */}
          {activeTab === 'avatar' && (
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-image me-2"></i>
                  Avatar Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="text-center mb-4">
                      <img 
                        src={user.avatar || user.gravatarUrl} 
                        alt="Current Avatar"
                        className="rounded-circle shadow"
                        style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                      />
                      <p className="mt-3">
                        {user.avatar ? 'Custom Avatar' : 'Gravatar'}
                      </p>
                    </div>

                    <div className="mb-3">
                      <button 
                        className="btn btn-outline-secondary w-100 mb-2"
                        onClick={handleResetAvatar}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Reset to Gravatar
                      </button>
                      <div className="form-text text-center">
                        Gravatar uses your email to generate an avatar
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h6>Set Custom Avatar</h6>
                    <form onSubmit={handleAvatarSubmit}>
                      <div className="mb-3">
                        <label className="form-label">Avatar URL</label>
                        <input
                          type="url"
                          className="form-control"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                        />
                        <div className="form-text">
                          Enter a direct image URL for your avatar
                        </div>
                      </div>

                      <button type="submit" className="btn btn-info w-100">
                        Update Avatar
                      </button>
                    </form>

                    <div className="mt-4">
                      <h6>Popular Avatar Services:</h6>
                      <div className="list-group">
                        <a 
                          href="https://gravatar.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="list-group-item list-group-item-action"
                        >
                          <i className="bi bi-globe me-2"></i>
                          Gravatar.com
                        </a>
                        <a 
                          href="https://imgbb.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="list-group-item list-group-item-action"
                        >
                          <i className="bi bi-upload me-2"></i>
                          Upload to ImgBB
                        </a>
                        <a 
                          href="https://postimages.org" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="list-group-item list-group-item-action"
                        >
                          <i className="bi bi-image me-2"></i>
                          PostImages
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Links */}
          {activeTab === 'social' && (
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-link-45deg me-2"></i>
                  Social Links
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-globe me-2"></i>
                        Website
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        value={profileData.website}
                        onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-twitter me-2"></i>
                        Twitter
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.twitter}
                        onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-instagram me-2"></i>
                        Instagram
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.instagram}
                        onChange={(e) => setProfileData({...profileData, instagram: e.target.value})}
                        placeholder="@username"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="bi bi-facebook me-2"></i>
                        Facebook
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.facebook}
                        onChange={(e) => setProfileData({...profileData, facebook: e.target.value})}
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-success">
                      Update Social Links
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div className="card shadow-sm border-danger">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Danger Zone
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-danger">
                  <h6>
                    <i className="bi bi-exclamation-octagon me-2"></i>
                    Warning
                  </h6>
                  <p className="mb-0">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                </div>

                <div className="border rounded p-4 mb-4">
                  <h6 className="text-danger">Delete Account</h6>
                  <p className="text-muted">
                    This will permanently delete your account and remove all your comments.
                    Your articles will remain but will be attributed to "Deleted User".
                  </p>
                  
                  <form onSubmit={handleDeleteAccount}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Confirm Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={deleteData.password}
                          onChange={(e) => setDeleteData({...deleteData, password: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Confirm Again</label>
                        <input
                          type="password"
                          className="form-control"
                          value={deleteData.confirmPassword}
                          onChange={(e) => setDeleteData({...deleteData, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end">
                      <button 
                        type="submit" 
                        className="btn btn-danger"
                        disabled={!deleteData.password || deleteData.password !== deleteData.confirmPassword}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Delete My Account
                      </button>
                    </div>
                  </form>
                </div>

                <div className="border rounded p-4">
                  <h6 className="text-warning">Export Data</h6>
                  <p className="text-muted mb-3">
                    Download all your data before deleting your account.
                  </p>
                  <button className="btn btn-outline-warning">
                    <i className="bi bi-download me-2"></i>
                    Export My Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;