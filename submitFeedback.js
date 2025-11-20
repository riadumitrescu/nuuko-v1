export async function submitFeedback(data) {
  const payload = {
    ...data,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    appVersion: 'v1',
  };

  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbxjgTkUwuLIRmprgdoFDIOD4IdV3mOvwRo7vgnWsu5g8ptO6r0PI-27To_7ZD08nYEB/exec',
      {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    // With no-cors we get an opaque response; reaching here means the request was sent.
    console.info('Thanks for sharing your feedback with nuuko 💌');
    return response;
  } catch (error) {
    console.error('Sorry, we could not send your feedback right now.', error);
    throw error;
  }
}
