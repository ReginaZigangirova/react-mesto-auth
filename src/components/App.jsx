import React from 'react';
import Header from './Header'
import Main from './Main'
import Footer from './Footer'
import ImagePopup from './ImagePopup'
import api from '../utils.js/Api'
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import EditProfilePopup from './EditProfilePopup'
import EditAvatarPopup from './EditAvatarPopup'
import AddPlacePopup from './AddPlacePopup';
import { Route, Switch, Redirect, useHistory } from 'react-router-dom';
import Login from './Login';
import * as auth from "../utils.js/auth";
import ProtectedRoute from './ProtectedRoute';
import InfoTooltip from './InfoTooltip';
import Register from './Register';
function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);
   const [currentUser, setCurrentUser] = React.useState({});
   const history = useHistory();
   const [userEmailOnHeader, setUserEmailOnHeader] = React.useState('');
   const [message, setMessage] = React.useState(false);
   const [isInfoTooltipOpen, setIsInfoTooltipOpen] = React.useState(false);
   //popups
   const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = React.useState(false);
   const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
   const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = React.useState(false);
   const [selectedCard, setSelectedCard] = React.useState({});
   //cards
   const [cards, setCards] = React.useState([])
  React.useEffect(() => {
    checkToken();
    if (loggedIn) {
      history.push('/');
    Promise.all([api.getProfile(), api.getInitialCards()])
      .then(([user,cards]) => {
        setCards(cards);
        setCurrentUser(user);
      })
      .catch((err) => {
        console.log(err);
      })
      }
  }, [loggedIn]);
//попап аватар
function handleEditAvatarClick ()  {
    setIsEditAvatarPopupOpen(true)
}; 
//попап добавления карточки
function handleAddPlaceClick ()  {
 setIsAddPlacePopupOpen(true)
}; 
//попап профиль
function handleEditProfileClick ()  {
   setIsEditProfilePopupOpen(true)
}
//закрытие попапов 
function closeAllPopups () {
    setIsEditAvatarPopupOpen(false)
    setIsAddPlacePopupOpen(false)
    setIsEditProfilePopupOpen(false)
    setSelectedCard({});
    setIsInfoTooltipOpen(false);
}
//картинка попап
function handleCardClick(card) {
    setSelectedCard(card);
}
//редактирование профиля
function handleUpdateUser(user) {
  api.editProfile(user.name, user.about)
    .then((user) => {
        setCurrentUser(user)
        closeAllPopups();
    })
    .catch((err) => {
      console.log(err);
    });
}
//редактирование аватара
function handleAvatarUpdate({ avatar }) {
  api.setAvatar(avatar)
    .then(() => {
      setCurrentUser({ ...currentUser, avatar });
      closeAllPopups();
    }).catch((err) => {
      console.error(err);
    });
}
//лайк
function handleCardLike(card) {
  const isLiked = card.likes.some(i => i._id === currentUser._id);
  api.changeLikeCardStatus(card._id, isLiked)
    .then((newCard) => {
      const newCards = cards.map((c) => (c._id === card._id ? newCard : c));
      setCards(newCards);
    })
    .catch((res) => {
      console.log(res);
    });
}
//удаление карточки
function handleCardDelete(card) {
  api.deleteCard(card._id)
    .then(() => {
      setCards((items) => items.filter((c) => c._id !== card._id && c));
    }).catch((err) => {
      console.error(err);
    });
}
function handleAddPlaceSubmit(data) {
  api.addCard(data.name, data.link).then((newCard) => {
    setCards([newCard, ...cards]);
    closeAllPopups();
  }).catch((err) => {
    console.error(err);
  });
}
const onLogin = (email, password) => {
  auth
    .authorization(password, email)
    .then((res) => {
      if(res) {
        setLoggedIn(true);
        setUserEmailOnHeader(email);
        history.push('/');
        localStorage.setItem('jwt', res.token);
      }
    })
    .catch(() => {
      setMessage(false);
      setIsInfoTooltipOpen(true);
    });
}
const onRegister = (email, password) => {
  auth
    .register(password, email)
    .then((res) => {        
      if(res) {
        setMessage(true);
        history.push('/sign-in');
      }
    })
    .catch(() => {
      setMessage(false);        
    })
    .finally(() => {
      setIsInfoTooltipOpen(true);
    });
}
const checkToken = () => {
  const token = localStorage.getItem('jwt');
  if(token) {
    setLoggedIn(true);
  auth
    .validityToken(token)
    .then((res) => {
      if(res) {
        setUserEmailOnHeader(res.data.email)
      };
      history.push('/');
    })
    .catch((err) => {
      console.log(err);
    });
  }
}
const logoutProfile = () => {
  localStorage.removeItem('jwt');
  setLoggedIn(false);
  setCurrentUser({});
}
  return (
    <CurrentUserContext.Provider value={currentUser}>
    <div className="App">
      <div className="wrapper">
      <div className="page">
      <Header userEmailOnHeader={userEmailOnHeader}
      logoutProfile={logoutProfile}
      />
      <Switch>
      <ProtectedRoute
            onCardClick={handleCardClick}
            onEditProfile={handleEditProfileClick}
            onAddPlace={handleAddPlaceClick}
            onEditAvatar={handleEditAvatarClick}
            onCardLike={handleCardLike}
            onCardDelete={handleCardDelete}
            cards={cards}
            component={Main}
            exact path="/"
            loggedIn={loggedIn}
          />
      <Route path="/sign-in">  
      <Login onLogin={onLogin}></Login>     
          </Route>
          <Route path="/sign-up">
          <Register 
              onRegister={onRegister}
            />
          </Route>
          <Route path='*'>
            {loggedIn ? <Redirect to="/" /> : <Redirect to="/sign-up"/>}
          </Route>
      </Switch>
      <Footer />
      <InfoTooltip
          isOpen={isInfoTooltipOpen}
          onClose={closeAllPopups}
          status={message}
        />
      <EditProfilePopup 
      isOpen={isEditProfilePopupOpen} 
      onClose={closeAllPopups} 
      onUpdateUser={handleUpdateUser}/>
      <EditAvatarPopup 
       isOpen={isEditAvatarPopupOpen} 
       onClose={closeAllPopups}
       onSubmit={handleAvatarUpdate} />
      <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onSubmit={handleAddPlaceSubmit}
        />
      <ImagePopup card={selectedCard} onClose={closeAllPopups}/>
    </div>
    </div>
    </div>
    </CurrentUserContext.Provider>
  );
}

export default App;
