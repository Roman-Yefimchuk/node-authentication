module.exports = {
    getUserContext: function (user) {

        function getGenericInfo() {
            if (user) {
                if (user.local && user.local.email) {
                    return {
                        displayName: user.local.name,
                        provider: 'local'
                    };
                }
                if (user.facebook && user.facebook.token) {
                    return {
                        displayName: user.facebook.name,
                        provider: 'facebook'
                    };
                }
                if (user.twitter && user.twitter.token) {
                    return {
                        displayName: user.twitter.displayName,
                        provider: 'twitter'
                    };
                }
                if (user.google && user.google.token) {
                    return {
                        displayName: user.google.name,
                        provider: 'google'
                    };
                }
            }
        }

        var genericInfo = getGenericInfo();
        return {
            get isEmpty() {
                return !genericInfo
            },
            get userId() {
                if (genericInfo) {
                    return user['_id'].toString();
                }
            },
            get displayName() {
                if (genericInfo) {
                    return genericInfo['displayName'];
                }
            },
            get provider() {
                if (genericInfo) {
                    return genericInfo['provider'];
                }
            }
        }
    }
};