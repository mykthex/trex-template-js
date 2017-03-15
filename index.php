<?php

require_once( "lib/Twig/Autoloader.php" );

Twig_Autoloader::register();
// Load template files from the ./tpl/ folder and use ./tpl/cache/ for caching
$twig = new Twig_Environment( new Twig_Loader_Filesystem("./twig"));
// Load and render 'template.tpl'
$tpl = $twig->loadTemplate( "pages/index.twig" );

// Send mail form submit
if(isset($_POST["courriel"])) {
    $formValide = true;
    $arrErrors =  array();
    if($_POST["name"] == "") {
        $formValide = false;
        $arrErrors["name"] = "Le nom est requis.";
    }
    if($_POST["message"] == "") {
        $formValide = false;
        $arrErrors["message"] = "Le message est requis.";
    }
    if($_POST["courriel"] == "") {
        $formValide = false;
        $arrErrors["courriel"] = "Le courriel est requis.";
    }
    // Send mail
    if($formValide == true) {
        $to  = "info@ecriteau.ca";
        $subject = "Nouveau message - Contact pour l'écriteau";
        $message = "<h2>Nouveau message de la part de: " . $_POST["name"] . "</h2>";
        $message .= "<p>" . $_POST["message"] . "</p>";
        $message .= "Message de la part de ecriteau.ca.";
        $headers = "From: " . strip_tags($_POST['courriel']) . "\r\n";
        $headers .= "Reply-To: " . strip_tags($_POST['courriel']) . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

        mail($to, $subject, $message, $headers);
        echo $tpl->render(array("success"=> true));
    } else {
        echo $tpl->render(array("errors"=> $arrErrors, "postContent" => $_POST));
    }
} else {
    echo $tpl->render(array());
}


