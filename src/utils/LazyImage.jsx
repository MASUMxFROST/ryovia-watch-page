import { motion } from "framer-motion";

export default function LazyImage({
  src,
  alt,
  isAnimated,
  transition,
  animate,
  initial,
  className,
  style,
}) {
  return (
    <motion.img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      animate={isAnimated ? animate : undefined}
      transition={isAnimated ? transition : undefined}
      initial={isAnimated ? initial : undefined}
      style={style}
    />
  );
}
