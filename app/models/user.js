var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose['Schema'];

var userSchema = Schema({
    local: {
        email: {
            type: String
        },
        password: {
            type: String
        }
    },
    facebook: {
        id: {
            type: String
        },
        token: {
            type: String
        },
        email: {
            type: String
        },
        name: {
            type: String
        }
    },
    twitter: {
        id: {
            type: String
        },
        token: {
            type: String
        },
        displayName: {
            type: String
        },
        username: {
            type: String
        }
    },
    google: {
        id: {
            type: String
        },
        token: {
            type: String
        },
        email: {
            type: String
        },
        name: {
            type: String
        }
    }
});

// generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
