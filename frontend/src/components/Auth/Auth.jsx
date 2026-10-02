import { Leaf } from "lucide-react";

export default function Auth({
  title,
  subtitle,
  children
}) {

  return (

    <div className="auth-page">

      <div className="auth-side">

        <div className="auth-brand">

          <span className="brandmark">
            <Leaf size={20} />
          </span>

          KrishiConnect

        </div>


        <div>

          <span className="section-kicker">
            FARM TO HOME
          </span>

          <h1>
            Fresh choices.
            <br />
            <span>Better connections.</span>
          </h1>

          <p>
            Join a modern marketplace connecting consumers
            with the farmers behind their food.
          </p>

        </div>

      </div>


      <div className="auth-panel">

        <div className="authbox">

          <div className="auth-mobile-brand">

            <span className="brandmark">
              <Leaf size={19} />
            </span>

            KrishiConnect

          </div>


          <h2>
            {title}
          </h2>


          <p className="auth-subtitle">
            {subtitle}
          </p>


          {children}

        </div>

      </div>

    </div>
  );
}
