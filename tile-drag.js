// Pointer capture keeps a mouse, pen or touch drag alive outside the hand.
export function bindTileDrag(source, callbacks) {
  let gesture = null;
  const cancel = () => {
    if (!gesture) return;
    const id = gesture.id;
    gesture = null;
    if (source.hasPointerCapture?.(id)) source.releasePointerCapture(id);
    callbacks.cancel();
  };
  source.addEventListener('pointerdown', e => {
    if (gesture || e.isPrimary === false || e.button > 0) return;
    e.preventDefault();
    gesture = {id:e.pointerId,x:e.clientX,y:e.clientY,started:false};
    source.setPointerCapture(e.pointerId);
  });
  source.addEventListener('pointermove', e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    if (!gesture.started && Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y) < 7) return;
    if (!gesture.started) { gesture.started = true; callbacks.start(e); }
    callbacks.move(e);
  });
  source.addEventListener('pointerup', e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const started = gesture.started;
    gesture = null; // Release/callback may synchronously rerender the hand.
    if (source.hasPointerCapture?.(e.pointerId)) source.releasePointerCapture(e.pointerId);
    if (started) callbacks.drop(e); else callbacks.tap?.();
  });
  source.addEventListener('pointercancel', cancel);
  source.addEventListener('lostpointercapture', cancel);
  source.addEventListener('dragstart', e => e.preventDefault());
  return cancel;
}
