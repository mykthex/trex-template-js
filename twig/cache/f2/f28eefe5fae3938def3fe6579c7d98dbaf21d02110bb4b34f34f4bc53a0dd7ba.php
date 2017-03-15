<?php

/* pages/index.twig */
class __TwigTemplate_f01ae77a428cba71aa243c517ab9d4635e495a520e06ed4e021dea04a48c9f6c extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        // line 1
        $this->parent = $this->loadTemplate("../layouts/single-column.twig", "pages/index.twig", 1);
        $this->blocks = array(
            'content' => array($this, 'block_content'),
        );
    }

    protected function doGetParent(array $context)
    {
        return "../layouts/single-column.twig";
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        // line 3
        $context["title"] = "";
        // line 4
        $context["class"] = "";
        // line 1
        $this->parent->display($context, array_merge($this->blocks, $blocks));
    }

    // line 6
    public function block_content($context, array $blocks = array())
    {
        // line 7
        echo "    <p>lol</p>
    <h2>";
        // line 8
        echo twig_escape_filter($this->env, (isset($context["msg"]) ? $context["msg"] : null), "html", null, true);
        echo "</h2>
";
    }

    public function getTemplateName()
    {
        return "pages/index.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  39 => 8,  36 => 7,  33 => 6,  29 => 1,  27 => 4,  25 => 3,  11 => 1,);
    }
}
/* {% extends "../layouts/single-column.twig" %}*/
/* */
/* {% set title = "" %}*/
/* {% set class = "" %}*/
/* */
/* {% block content %}*/
/*     <p>lol</p>*/
/*     <h2>{{msg}}</h2>*/
/* {% endblock %}*/
/* */
