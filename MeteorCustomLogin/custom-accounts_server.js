import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

/**
 * Regist custom login handler.
 *
 * When using at client, pass to these parameters.
 * * customLogin: boolean - to decide proceed custom login or not.
 * * company: String - company code
 * * userid: String - userid at company
 * * password: String - password
 *
 * ex: call asteroid.login function
 * asteroid.login({customLogin: true, company:"qox", userid: "kponda", password: "password123"})
 *
 */
Accounts.registerLoginHandler('NameForCustomLogin', (options) => {
  if(!options.customLogin) {
    return undefined;
  }
  
  const company = options.company;
  const userid = options.userid;
  const password = options.password;
  
  // check parameters
  if(!company || !userid || !password) {
    throw new Meteor.Error( 403, 'login failed' );;
  }
  
  // call custom login function, this function useing postgresql.
  var user = Meteor.wrapAsync(global.models.User.login)(company, userid, password);
  
  if(user) {
    console.log('login successed');
  } else {
    throw new Meteor.Error( 403, 'login failed' );;
  }
  
  let profile = {};
  profile.id = user.id;
  profile.userid = user.userid;
  profile.company = user.company;
  profile.name = user.name;

  // create Meteors user account
  var checked = Accounts.updateOrCreateUserFromExternalService("NameForCustomLogin",
    { id: user.company + '.' + user.userid, profile: profile }
  );
  // update profile
  Meteor.users.update(checked.userid,
    {$set: {'profile': profile}}
  );

  // generate login token
  var stampedToken = Accounts._generateStampedLoginToken();
  var hashStampedToken = Accounts._hashStampedToken(stampedToken);

  Meteor.users.update(checked.userid,
    {$push: {'services.resume.loginTokens': hashStampedToken}}
  );
  checked.token = stampedToken.token;
  return checked;
});
