importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB7yUZrBmJHprDEfaV74X3KQYEYqWUlwJ0",
  authDomain: "horizonte-zingst.firebaseapp.com",
  projectId: "horizonte-zingst",
  storageBucket: "horizonte-zingst.firebasestorage.app",
  messagingSenderId: "429781684939",
  appId: "1:429781684939:web:1ed601e908861389efc14e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  })
})
